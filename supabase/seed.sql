-- ============================================================================
-- DESPENSA AI - SEED: CATEGORÍAS POR DEFECTO
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
