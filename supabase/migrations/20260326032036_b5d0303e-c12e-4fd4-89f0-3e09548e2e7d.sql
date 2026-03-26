
-- Delivery status enum
CREATE TYPE public.delivery_status AS ENUM ('pendiente', 'preparando', 'en_camino', 'entregado', 'cancelado');

-- Delivery orders table
CREATE TABLE public.delivery_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  customer_address TEXT NOT NULL DEFAULT '',
  status delivery_status NOT NULL DEFAULT 'pendiente',
  delivery_notes TEXT,
  assigned_driver TEXT,
  estimated_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated can read delivery orders"
  ON public.delivery_orders FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin can manage delivery orders"
  ON public.delivery_orders FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Jefe can insert delivery orders"
  ON public.delivery_orders FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'jefe_local'::app_role));

CREATE POLICY "Jefe can update delivery orders"
  ON public.delivery_orders FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'jefe_local'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_orders;
