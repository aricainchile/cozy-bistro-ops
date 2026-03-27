
-- Fix Cerveza Artesanal to be in Cervezas category (was incorrectly in Carne)
UPDATE public.products SET category_id = 'c87e7b72-751e-4777-8269-a018c2c3bdf3' WHERE name = 'Cerveza Artesanal';
