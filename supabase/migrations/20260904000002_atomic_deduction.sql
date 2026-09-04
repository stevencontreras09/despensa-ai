-- ============================================================================
-- DESPENSA AI - MIGRACIÓN 003: PROCEDIMIENTO TRANSACCIONAL DE DEDUCCIÓN ATÓMICA
-- ============================================================================

CREATE OR REPLACE FUNCTION deduct_recipe_atomic(
    p_household_id UUID,
    p_idempotency_key TEXT,
    p_recipe_id TEXT,
    p_recipe_title TEXT,
    p_items JSONB -- Array: [{"item_id": "UUID", "used_quantity": 1.5}]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_response JSONB;
    v_elem JSONB;
    v_item_id UUID;
    v_used_qty DECIMAL(8,2);
    v_curr_item RECORD;
    v_new_qty DECIMAL(8,2);
    v_saved_amount DECIMAL(10,2) := 0.00;
    v_deducted_count INTEGER := 0;
    v_depleted_items TEXT[] := ARRAY[]::TEXT[];
    v_result JSONB;
BEGIN
    -- 1. Verificar idempotencia
    SELECT response INTO v_existing_response
    FROM idempotency_keys
    WHERE household_id = p_household_id AND key = p_idempotency_key;

    IF FOUND THEN
        RETURN v_existing_response;
    END IF;

    -- 2. Procesar cada ingrediente con bloqueo pesimista
    FOR v_elem IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_id := (v_elem->>'item_id')::UUID;
        v_used_qty := (v_elem->>'used_quantity')::DECIMAL(8,2);

        -- Bloqueo pesimista de fila
        SELECT id, name, quantity, unit, estimated_cost, status
        INTO v_curr_item
        FROM inventory_items
        WHERE id = v_item_id AND household_id = p_household_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Item de inventario con ID % no encontrado en este hogar.', v_item_id;
        END IF;

        IF v_curr_item.status != 'active' THEN
            RAISE EXCEPTION 'El item % ya no se encuentra activo.', v_curr_item.name;
        END IF;

        -- Calcular nueva cantidad
        v_new_qty := GREATEST(0.00, v_curr_item.quantity - v_used_qty);

        -- Calcular aporte al ahorro financiero
        IF v_curr_item.estimated_cost IS NOT NULL AND v_curr_item.quantity > 0 THEN
            v_saved_amount := v_saved_amount + ROUND((v_curr_item.estimated_cost / v_curr_item.quantity) * LEAST(v_curr_item.quantity, v_used_qty), 2);
        END IF;

        -- Registrar log de consumo
        INSERT INTO consumption_logs (
            household_id, item_id, item_name, action, quantity, unit, financial_impact
        ) VALUES (
            p_household_id,
            v_item_id,
            v_curr_item.name,
            'consumed',
            LEAST(v_curr_item.quantity, v_used_qty),
            v_curr_item.unit,
            COALESCE(ROUND((v_curr_item.estimated_cost / v_curr_item.quantity) * LEAST(v_curr_item.quantity, v_used_qty), 2), 0.00)
        );

        IF v_new_qty <= 0 THEN
            -- Marcar como consumido
            UPDATE inventory_items
            SET quantity = 0,
                status = 'consumed',
                updated_at = now()
            WHERE id = v_item_id;

            -- Auto-sugerir en lista de compras
            INSERT INTO shopping_list_items (household_id, name, quantity, unit, is_auto_suggested)
            VALUES (p_household_id, v_curr_item.name, 1.00, v_curr_item.unit, true);

            v_depleted_items := array_append(v_depleted_items, v_curr_item.name);
        ELSE
            -- Descontar stock parcial
            UPDATE inventory_items
            SET quantity = v_new_qty,
                updated_at = now()
            WHERE id = v_item_id;
        END IF;

        v_deducted_count := v_deducted_count + 1;
    END LOOP;

    -- 3. Construir resultado estructurado
    v_result := jsonb_build_object(
        'success', true,
        'recipe_id', p_recipe_id,
        'recipe_title', p_recipe_title,
        'items_deducted', v_deducted_count,
        'total_money_saved', v_saved_amount,
        'depleted_items_added_to_shopping_list', to_jsonb(v_depleted_items),
        'timestamp', now()
    );

    -- 4. Guardar clave de idempotencia
    INSERT INTO idempotency_keys (household_id, key, action, response)
    VALUES (p_household_id, p_idempotency_key, 'deduct_recipe', v_result);

    RETURN v_result;
END;
$$;
