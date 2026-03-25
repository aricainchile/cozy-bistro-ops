
-- Drop the overly permissive update policy
DROP POLICY "All authenticated can update table status" ON public.restaurant_tables;

-- Update the existing policy to allow all authenticated to update
DROP POLICY "Admins and jefe_local can update tables" ON public.restaurant_tables;

CREATE POLICY "Authenticated can update tables"
  ON public.restaurant_tables FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'jefe_local') OR public.has_role(auth.uid(), 'garzon')
  );
