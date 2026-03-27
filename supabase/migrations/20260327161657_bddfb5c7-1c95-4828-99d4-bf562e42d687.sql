
-- Add print_destination to categories so we know where to route each category
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS print_destination text NOT NULL DEFAULT 'cocina';

-- Create print_jobs table
CREATE TABLE public.print_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  order_number integer NOT NULL,
  table_info text NOT NULL DEFAULT '',
  destination text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated can read print jobs" ON public.print_jobs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert print jobs" ON public.print_jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'jefe_local'::app_role) OR 
    has_role(auth.uid(), 'garzon'::app_role)
  );

CREATE POLICY "Authenticated can update print jobs" ON public.print_jobs
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'jefe_local'::app_role) OR 
    has_role(auth.uid(), 'garzon'::app_role)
  );

CREATE POLICY "Admin can delete print jobs" ON public.print_jobs
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for print_jobs
ALTER PUBLICATION supabase_realtime ADD TABLE public.print_jobs;
