
-- Create movement type enum
CREATE TYPE public.movement_type AS ENUM ('entrada', 'salida', 'ajuste', 'venta');

-- Create inventory items table (links products to stock tracking)
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  current_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'un',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read inventory items"
  ON public.inventory_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Jefe and admin can manage inventory items"
  ON public.inventory_items FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'jefe_local'));

CREATE POLICY "Jefe and admin can update inventory items"
  ON public.inventory_items FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'jefe_local'));

CREATE POLICY "Admins can delete inventory items"
  ON public.inventory_items FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Create inventory movements table (entry/exit log)
CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  type movement_type NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  reason TEXT,
  invoice_number TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read inventory movements"
  ON public.inventory_movements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Jefe and admin can create movements"
  ON public.inventory_movements FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'jefe_local'));

CREATE POLICY "Admins can delete movements"
  ON public.inventory_movements FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Function to update stock after movement
CREATE OR REPLACE FUNCTION public.update_inventory_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type IN ('entrada', 'ajuste') THEN
    UPDATE public.inventory_items
    SET current_stock = current_stock + NEW.quantity, updated_at = now()
    WHERE id = NEW.inventory_item_id;
  ELSIF NEW.type IN ('salida', 'venta') THEN
    UPDATE public.inventory_items
    SET current_stock = current_stock - NEW.quantity, updated_at = now()
    WHERE id = NEW.inventory_item_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_inventory_stock
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_stock();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_movements;
