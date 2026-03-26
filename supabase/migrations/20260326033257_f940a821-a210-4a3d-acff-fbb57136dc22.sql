
-- Loyalty customers
CREATE TABLE public.loyalty_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  total_visits INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'Bronze',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_visit_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Loyalty rewards catalog
CREATE TABLE public.loyalty_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Loyalty transactions (earn/redeem)
CREATE TABLE public.loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.loyalty_customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'earn',
  points INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  reward_id UUID REFERENCES public.loyalty_rewards(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.loyalty_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Customers policies
CREATE POLICY "Authenticated can read loyalty customers" ON public.loyalty_customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage loyalty customers" ON public.loyalty_customers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Jefe can insert loyalty customers" ON public.loyalty_customers FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'jefe_local'::app_role));
CREATE POLICY "Jefe can update loyalty customers" ON public.loyalty_customers FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'jefe_local'::app_role));

-- Rewards policies
CREATE POLICY "Authenticated can read loyalty rewards" ON public.loyalty_rewards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage loyalty rewards" ON public.loyalty_rewards FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Transactions policies
CREATE POLICY "Authenticated can read loyalty transactions" ON public.loyalty_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage loyalty transactions" ON public.loyalty_transactions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Jefe can insert loyalty transactions" ON public.loyalty_transactions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'jefe_local'::app_role));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_transactions;

-- Auto-update tier function
CREATE OR REPLACE FUNCTION public.update_loyalty_tier()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.points >= 2000 THEN NEW.tier := 'Platinum';
  ELSIF NEW.points >= 1000 THEN NEW.tier := 'Gold';
  ELSIF NEW.points >= 500 THEN NEW.tier := 'Silver';
  ELSE NEW.tier := 'Bronze';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_loyalty_tier
  BEFORE INSERT OR UPDATE OF points ON public.loyalty_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_loyalty_tier();
