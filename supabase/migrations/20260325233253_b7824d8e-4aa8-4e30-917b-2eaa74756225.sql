
-- Create payment method enum
CREATE TYPE public.payment_method AS ENUM ('efectivo', 'debito', 'credito', 'transferencia', 'cuenta_empresa');

-- Create cash sessions table
CREATE TABLE public.cash_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opened_by UUID NOT NULL,
  closed_by UUID,
  opening_amount INT NOT NULL DEFAULT 0,
  closing_amount INT,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  is_open BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read cash sessions"
  ON public.cash_sessions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Jefe and admin can manage cash sessions"
  ON public.cash_sessions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'jefe_local'));

CREATE POLICY "Jefe and admin can update cash sessions"
  ON public.cash_sessions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'jefe_local'));

CREATE POLICY "Admins can delete cash sessions"
  ON public.cash_sessions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  cash_session_id UUID REFERENCES public.cash_sessions(id) ON DELETE SET NULL,
  method payment_method NOT NULL,
  amount INT NOT NULL,
  tip INT NOT NULL DEFAULT 0,
  receipt_number SERIAL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read payments"
  ON public.payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can create payments"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'jefe_local') OR has_role(auth.uid(), 'garzon'));

CREATE POLICY "Admins can delete payments"
  ON public.payments FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
