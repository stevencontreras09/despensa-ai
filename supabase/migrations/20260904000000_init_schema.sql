-- ============================================================================
-- DESPENSA AI - MIGRACIÓN INICIAL 001: ESQUEMA Y TABLAS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
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

-- 1. Hogares (households)
CREATE TABLE IF NOT EXISTS households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    invite_code VARCHAR(12) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_households_invite_code ON households(invite_code);

-- 2. Perfiles de usuario (users) sincronizados con auth.users
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

-- 3. Miembros del hogar (household_members)
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

-- 4. Zonas de almacenamiento (storage_locations)
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

-- 5. Categorías globales de alimentos
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    default_shelf_life_days INTEGER NOT NULL DEFAULT 7,
    ideal_location TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Inventario de productos (inventory_items)
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

-- 7. Lista de compras (shopping_list_items)
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

-- 8. Claves de idempotencia
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

-- 9. Historial de consumo y desperdicio (consumption_logs)
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
