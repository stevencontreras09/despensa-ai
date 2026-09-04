-- ============================================================================
-- DESPENSA AI - SCRIPT COMPLETO DE BASE DE DATOS (TODO EN UNO PARA SUPABASE SQL EDITOR)
-- Copia y pega este contenido directamente en el SQL Editor de tu proyecto Supabase
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE member_role AS ENUM ('admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE item_status AS ENUM ('active', 'consumed', 'wasted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recipe_difficulty AS ENUM ('Fácil', 'Intermedio', 'Avanzado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Hogares (households)
CREATE TABLE IF NOT EXISTS households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    invite_code VARCHAR(12) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_households_invite_code ON households(invite_code);

-- 3. Perfiles de usuario (users) sincronizados con auth.users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para sincronizar auth.users -> public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Miembros del hogar (household_members)
CREATE TABLE IF NOT EXISTS household_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role member_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (household_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_household_members_lookup ON household_members(household_id, user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id);

-- 5. Zonas de almacenamiento (storage_locations)
CREATE TABLE IF NOT EXISTS storage_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_storage_locations_household ON storage_locations(household_id);

-- Trigger: Precargar 4 zonas al crear un hogar (Nevera, Congelador, Despensa Seca, Frutero)
CREATE OR REPLACE FUNCTION public.seed_default_storage_locations()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.storage_locations (household_id, name, is_default)
    VALUES
        (NEW.id, 'Nevera', true),
        (NEW.id, 'Congelador', true),
        (NEW.id, 'Despensa Seca', true),
        (NEW.id, 'Frutero', true);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_household_created_seed_locations ON households;
CREATE TRIGGER on_household_created_seed_locations
    AFTER INSERT ON households
    FOR EACH ROW EXECUTE FUNCTION public.seed_default_storage_locations();

-- 6. Categorías globales de alimentos
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    default_shelf_life_days INTEGER NOT NULL DEFAULT 7,
    ideal_location TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Inventario de productos (inventory_items)
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    storage_location_id UUID NOT NULL REFERENCES storage_locations(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    quantity DECIMAL(8,2) NOT NULL DEFAULT 1.00 CHECK (quantity >= 0),
    unit TEXT NOT NULL DEFAULT 'unidad',
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiration_date DATE NOT NULL,
    estimated_cost DECIMAL(10,2) DEFAULT NULL CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
    status item_status NOT NULL DEFAULT 'active',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_household_status ON inventory_items(household_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_expiration ON inventory_items(household_id, expiration_date) WHERE status = 'active';

-- 8. Lista de compras (shopping_list_items)
CREATE TABLE IF NOT EXISTS shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity DECIMAL(8,2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'unidad',
    is_auto_suggested BOOLEAN NOT NULL DEFAULT false,
    is_purchased BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shopping_list_household ON shopping_list_items(household_id, is_purchased);

-- 9. Claves de idempotencia
CREATE TABLE IF NOT EXISTS idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    action TEXT NOT NULL,
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (household_id, key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_lookup ON idempotency_keys(household_id, key);

-- 10. Historial de consumo y desperdicio (consumption_logs)
CREATE TABLE IF NOT EXISTS consumption_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    action item_status NOT NULL CHECK (action IN ('consumed', 'wasted')),
    quantity DECIMAL(8,2) NOT NULL,
    unit TEXT NOT NULL,
    financial_impact DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consumption_logs_household ON consumption_logs(household_id, created_at);

-- ============================================================================
-- HELPER FUNCTIONS Y SEGURIDAD RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_member_of(p_household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.household_members
        WHERE household_id = p_household_id
          AND user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_of(p_household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.household_members
        WHERE household_id = p_household_id
          AND user_id = auth.uid()
          AND role = 'admin'
    );
$$;

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_logs ENABLE ROW LEVEL SECURITY;

-- users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- households
DROP POLICY IF EXISTS "Members can view their households" ON households;
CREATE POLICY "Members can view their households" ON households
    FOR SELECT USING (is_member_of(id));

DROP POLICY IF EXISTS "Authenticated users can create households" ON households;
CREATE POLICY "Authenticated users can create households" ON households
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can update their household" ON households;
CREATE POLICY "Admins can update their household" ON households
    FOR UPDATE USING (is_admin_of(id));

-- household_members
DROP POLICY IF EXISTS "Members can view household member list" ON household_members;
CREATE POLICY "Members can view household member list" ON household_members
    FOR SELECT USING (is_member_of(household_id));

DROP POLICY IF EXISTS "Users can join households via valid invitation" ON household_members;
CREATE POLICY "Users can join households via valid invitation" ON household_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage household members" ON household_members;
CREATE POLICY "Admins can manage household members" ON household_members
    FOR DELETE USING (is_admin_of(household_id) OR user_id = auth.uid());

-- storage_locations
DROP POLICY IF EXISTS "Members can view storage locations" ON storage_locations;
CREATE POLICY "Members can view storage locations" ON storage_locations
    FOR SELECT USING (is_member_of(household_id));

DROP POLICY IF EXISTS "Members can create storage locations" ON storage_locations;
CREATE POLICY "Members can create storage locations" ON storage_locations
    FOR INSERT WITH CHECK (is_member_of(household_id));

DROP POLICY IF EXISTS "Members can update storage locations" ON storage_locations;
CREATE POLICY "Members can update storage locations" ON storage_locations
    FOR UPDATE USING (is_member_of(household_id));

DROP POLICY IF EXISTS "Admins can delete storage locations" ON storage_locations;
CREATE POLICY "Admins can delete storage locations" ON storage_locations
    FOR DELETE USING (is_admin_of(household_id));

-- categories
DROP POLICY IF EXISTS "Anyone authenticated can read categories" ON categories;
CREATE POLICY "Anyone authenticated can read categories" ON categories
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- inventory_items
DROP POLICY IF EXISTS "Members can view inventory items" ON inventory_items;
CREATE POLICY "Members can view inventory items" ON inventory_items
    FOR SELECT USING (is_member_of(household_id));

DROP POLICY IF EXISTS "Members can insert inventory items" ON inventory_items;
CREATE POLICY "Members can insert inventory items" ON inventory_items
    FOR INSERT WITH CHECK (is_member_of(household_id));

DROP POLICY IF EXISTS "Members can update inventory items" ON inventory_items;
CREATE POLICY "Members can update inventory items" ON inventory_items
    FOR UPDATE USING (is_member_of(household_id));

DROP POLICY IF EXISTS "Members can delete inventory items" ON inventory_items;
CREATE POLICY "Members can delete inventory items" ON inventory_items
    FOR DELETE USING (is_member_of(household_id));

-- shopping_list_items
DROP POLICY IF EXISTS "Members can view shopping items" ON shopping_list_items;
CREATE POLICY "Members can view shopping items" ON shopping_list_items
    FOR SELECT USING (is_member_of(household_id));

DROP POLICY IF EXISTS "Members can insert shopping items" ON shopping_list_items;
CREATE POLICY "Members can insert shopping items" ON shopping_list_items
    FOR INSERT WITH CHECK (is_member_of(household_id));

DROP POLICY IF EXISTS "Members can update shopping items" ON shopping_list_items;
CREATE POLICY "Members can update shopping items" ON shopping_list_items
    FOR UPDATE USING (is_member_of(household_id));

DROP POLICY IF EXISTS "Members can delete shopping items" ON shopping_list_items;
CREATE POLICY "Members can delete shopping items" ON shopping_list_items
    FOR DELETE USING (is_member_of(household_id));

-- idempotency_keys
DROP POLICY IF EXISTS "Members can view idempotency records" ON idempotency_keys;
CREATE POLICY "Members can view idempotency records" ON idempotency_keys
    FOR SELECT USING (is_member_of(household_id));

DROP POLICY IF EXISTS "Members can create idempotency records" ON idempotency_keys;
CREATE POLICY "Members can create idempotency records" ON idempotency_keys
    FOR INSERT WITH CHECK (is_member_of(household_id));

-- consumption_logs
DROP POLICY IF EXISTS "Members can view household consumption logs" ON consumption_logs;
CREATE POLICY "Members can view household consumption logs" ON consumption_logs
    FOR SELECT USING (is_member_of(household_id));

DROP POLICY IF EXISTS "Members can insert consumption logs" ON consumption_logs;
CREATE POLICY "Members can insert consumption logs" ON consumption_logs
    FOR INSERT WITH CHECK (is_member_of(household_id));

-- ============================================================================
-- DEDUCCIÓN TRANSACCIONAL ATÓMICA (SELECT FOR UPDATE)
-- ============================================================================

CREATE OR REPLACE FUNCTION deduct_recipe_atomic(
    p_household_id UUID,
    p_idempotency_key TEXT,
    p_recipe_id TEXT,
    p_recipe_title TEXT,
    p_items JSONB
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
    SELECT response INTO v_existing_response
    FROM idempotency_keys
    WHERE household_id = p_household_id AND key = p_idempotency_key;

    IF FOUND THEN
        RETURN v_existing_response;
    END IF;

    FOR v_elem IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_id := (v_elem->>'item_id')::UUID;
        v_used_qty := (v_elem->>'used_quantity')::DECIMAL(8,2);

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

        v_new_qty := GREATEST(0.00, v_curr_item.quantity - v_used_qty);

        IF v_curr_item.estimated_cost IS NOT NULL AND v_curr_item.quantity > 0 THEN
            v_saved_amount := v_saved_amount + ROUND((v_curr_item.estimated_cost / v_curr_item.quantity) * LEAST(v_curr_item.quantity, v_used_qty), 2);
        END IF;

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
            UPDATE inventory_items
            SET quantity = 0,
                status = 'consumed',
                updated_at = now()
            WHERE id = v_item_id;

            INSERT INTO shopping_list_items (household_id, name, quantity, unit, is_auto_suggested)
            VALUES (p_household_id, v_curr_item.name, 1.00, v_curr_item.unit, true);

            v_depleted_items := array_append(v_depleted_items, v_curr_item.name);
        ELSE
            UPDATE inventory_items
            SET quantity = v_new_qty,
                updated_at = now()
            WHERE id = v_item_id;
        END IF;

        v_deducted_count := v_deducted_count + 1;
    END LOOP;

    v_result := jsonb_build_object(
        'success', true,
        'recipe_id', p_recipe_id,
        'recipe_title', p_recipe_title,
        'items_deducted', v_deducted_count,
        'total_money_saved', v_saved_amount,
        'depleted_items_added_to_shopping_list', to_jsonb(v_depleted_items),
        'timestamp', now()
    );

    INSERT INTO idempotency_keys (household_id, key, action, response)
    VALUES (p_household_id, p_idempotency_key, 'deduct_recipe', v_result);

    RETURN v_result;
END;
$$;

-- ============================================================================
-- SEED DE CATEGORÍAS
-- ============================================================================

INSERT INTO categories (name, default_shelf_life_days, ideal_location) VALUES
    ('Frutas y Verduras', 5, 'Frutero'),
    ('Lácteos y Huevos', 7, 'Nevera'),
    ('Carnes y Aves', 3, 'Nevera'),
    ('Pescados y Mariscos', 2, 'Nevera'),
    ('Congelados', 90, 'Congelador'),
    ('Panadería y Bollería', 4, 'Despensa Seca'),
    ('Despensa y Granos', 180, 'Despensa Seca'),
    ('Bebidas y Zumos', 14, 'Nevera'),
    ('Salsas y Condimentos', 60, 'Nevera'),
    ('Snacks y Dulces', 60, 'Despensa Seca')
ON CONFLICT (name) DO UPDATE
SET default_shelf_life_days = EXCLUDED.default_shelf_life_days,
    ideal_location = EXCLUDED.ideal_location;
