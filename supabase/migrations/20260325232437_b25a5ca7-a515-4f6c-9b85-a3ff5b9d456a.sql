
-- Fix overly permissive insert policy on order_items
DROP POLICY "Authenticated can insert order items" ON public.order_items;

CREATE POLICY "Authenticated can insert order items"
  ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'jefe_local') OR public.has_role(auth.uid(), 'garzon')
  );
