
-- Create enum for table status
CREATE TYPE public.table_status AS ENUM ('available', 'occupied', 'reserved');

-- Create restaurant_tables table
CREATE TABLE public.restaurant_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INT NOT NULL,
  seats INT NOT NULL DEFAULT 4,
  status table_status NOT NULL DEFAULT 'available',
  guests INT DEFAULT 0,
  waiter_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(table_number)
);

-- Enable RLS
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all tables
CREATE POLICY "Authenticated users can read tables"
  ON public.restaurant_tables FOR SELECT
  TO authenticated
  USING (true);

-- Admins and jefe_local can manage tables
CREATE POLICY "Admins and jefe_local can insert tables"
  ON public.restaurant_tables FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'jefe_local')
  );

CREATE POLICY "Admins and jefe_local can update tables"
  ON public.restaurant_tables FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'jefe_local')
  );

CREATE POLICY "Admins can delete tables"
  ON public.restaurant_tables FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- All authenticated can update status (garzones need this)
CREATE POLICY "All authenticated can update table status"
  ON public.restaurant_tables FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables;
