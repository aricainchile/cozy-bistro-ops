
-- Allow jefe_local to read all profiles
CREATE POLICY "Jefe can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'jefe_local'::app_role));

-- Allow jefe_local and admin to read all user_roles
CREATE POLICY "Jefe can read all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'jefe_local'::app_role));

-- Allow jefe_local to manage user_roles (insert/update)
CREATE POLICY "Jefe can manage roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'jefe_local'::app_role));

CREATE POLICY "Jefe can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'jefe_local'::app_role));

-- Allow admin to update profiles (for editing other users' names)
CREATE POLICY "Admin can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow jefe_local to update profiles
CREATE POLICY "Jefe can update profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'jefe_local'::app_role));
