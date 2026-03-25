
-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '📦',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read categories"
  ON public.categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INT NOT NULL DEFAULT 0,
  discount INT DEFAULT 0,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read products"
  ON public.products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage policies
CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated can upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated can update product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated can delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');

-- Seed default categories
INSERT INTO public.categories (name, icon, sort_order) VALUES
  ('Carne', '🥩', 1),
  ('Pollo', '🍗', 2),
  ('Cerdo', '🍖', 3),
  ('Pulpo', '🐙', 4),
  ('Acompañamientos', '🍟', 5),
  ('Cocktail', '🍸', 6),
  ('Jugos', '🧃', 7),
  ('Destilados', '🥃', 8),
  ('Vinos', '🍷', 9),
  ('Cervezas', '🍺', 10),
  ('Sándwich', '🥪', 11),
  ('Té', '🍵', 12),
  ('Café', '☕', 13);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
