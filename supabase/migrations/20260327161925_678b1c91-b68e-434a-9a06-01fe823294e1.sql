
-- Set beverage categories to print to 'barra'
UPDATE public.categories SET print_destination = 'barra' WHERE name IN ('Cocktail', 'Cervezas', 'Destilados', 'Vinos', 'Jugos');
-- Set café/té to barra as well
UPDATE public.categories SET print_destination = 'barra' WHERE name IN ('Café', 'Té');
