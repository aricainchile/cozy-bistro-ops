
CREATE TABLE public.printers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ip_address text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'cocina',
  location text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read printers"
  ON public.printers FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin can manage printers"
  ON public.printers FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Jefe can insert printers"
  ON public.printers FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'jefe_local'::app_role));

CREATE POLICY "Jefe can update printers"
  ON public.printers FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'jefe_local'::app_role));
