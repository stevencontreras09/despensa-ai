-- ============================================================================
-- DESPENSA AI - MIGRACIÓN 002: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Helper functions de seguridad (Security Definer para evitar recursión RLS)
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

-- Habilitar RLS en todas las tablas
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_logs ENABLE ROW LEVEL SECURITY;

-- 1. users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- 2. households
DROP POLICY IF EXISTS "Members can view their households" ON households;
CREATE POLICY "Members can view their households" ON households
    FOR SELECT USING (is_member_of(id));

DROP POLICY IF EXISTS "Authenticated users can create households" ON households;
CREATE POLICY "Authenticated users can create households" ON households
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can update their household" ON households;
CREATE POLICY "Admins can update their household" ON households
    FOR UPDATE USING (is_admin_of(id));

-- 3. household_members
DROP POLICY IF EXISTS "Members can view household member list" ON household_members;
CREATE POLICY "Members can view household member list" ON household_members
    FOR SELECT USING (is_member_of(household_id));

DROP POLICY IF EXISTS "Users can join households via valid invitation" ON household_members;
CREATE POLICY "Users can join households via valid invitation" ON household_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage household members" ON household_members;
CREATE POLICY "Admins can manage household members" ON household_members
    FOR DELETE USING (is_admin_of(household_id) OR user_id = auth.uid());

-- 4. storage_locations
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

-- 5. categories
DROP POLICY IF EXISTS "Anyone authenticated can read categories" ON categories;
CREATE POLICY "Anyone authenticated can read categories" ON categories
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 6. inventory_items
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

-- 7. shopping_list_items
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

-- 8. idempotency_keys
DROP POLICY IF EXISTS "Members can view idempotency records" ON idempotency_keys;
CREATE POLICY "Members can view idempotency records" ON idempotency_keys
    FOR SELECT USING (is_member_of(household_id));

DROP POLICY IF EXISTS "Members can create idempotency records" ON idempotency_keys;
CREATE POLICY "Members can create idempotency records" ON idempotency_keys
    FOR INSERT WITH CHECK (is_member_of(household_id));

-- 9. consumption_logs
DROP POLICY IF EXISTS "Members can view household consumption logs" ON consumption_logs;
CREATE POLICY "Members can view household consumption logs" ON consumption_logs
    FOR SELECT USING (is_member_of(household_id));

DROP POLICY IF EXISTS "Members can insert consumption logs" ON consumption_logs;
CREATE POLICY "Members can insert consumption logs" ON consumption_logs
    FOR INSERT WITH CHECK (is_member_of(household_id));
