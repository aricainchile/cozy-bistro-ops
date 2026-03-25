
-- Create subcategories table
CREATE TABLE public.subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, category_id)
);

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read subcategories"
  ON public.subcategories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage subcategories"
  ON public.subcategories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add subcategory_id to products
ALTER TABLE public.products ADD COLUMN subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.subcategories;

-- Seed some subcategories
INSERT INTO public.subcategories (name, category_id, sort_order)
SELECT s.name, c.id, s.sort_order
FROM (VALUES
  ('Res', 'Carne', 1),
  ('Wagyu', 'Carne', 2),
  ('Cortes Premium', 'Carne', 3),
  ('Pechuga', 'Pollo', 1),
  ('Entero', 'Pollo', 2),
  ('Costillar', 'Cerdo', 1),
  ('Chuleta', 'Cerdo', 2),
  ('Grillado', 'Pulpo', 1),
  ('Al horno', 'Pulpo', 2),
  ('Ensaladas', 'Acompañamientos', 1),
  ('Papas', 'Acompañamientos', 2),
  ('Guarniciones', 'Acompañamientos', 3),
  ('Clásicos', 'Cocktail', 1),
  ('De autor', 'Cocktail', 2),
  ('Naturales', 'Jugos', 1),
  ('Smoothies', 'Jugos', 2),
  ('Tinto', 'Vinos', 1),
  ('Blanco', 'Vinos', 2),
  ('Rosé', 'Vinos', 3)
) AS s(name, cat_name, sort_order)
JOIN public.categories c ON c.name = s.cat_name;
