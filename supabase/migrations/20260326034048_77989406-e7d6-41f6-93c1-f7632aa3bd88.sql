
-- Staff members
CREATE TABLE public.staff_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Garzón',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT,
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Staff shifts
CREATE TABLE public.staff_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Staff attendance
CREATE TABLE public.staff_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  check_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  check_out TIMESTAMP WITH TIME ZONE,
  shift_id UUID REFERENCES public.staff_shifts(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;

-- Staff members policies
CREATE POLICY "Authenticated can read staff" ON public.staff_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage staff" ON public.staff_members FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Jefe can insert staff" ON public.staff_members FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'jefe_local'::app_role));
CREATE POLICY "Jefe can update staff" ON public.staff_members FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'jefe_local'::app_role));

-- Shifts policies
CREATE POLICY "Authenticated can read shifts" ON public.staff_shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage shifts" ON public.staff_shifts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Jefe can insert shifts" ON public.staff_shifts FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'jefe_local'::app_role));
CREATE POLICY "Jefe can update shifts" ON public.staff_shifts FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'jefe_local'::app_role));

-- Attendance policies
CREATE POLICY "Authenticated can read attendance" ON public.staff_attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage attendance" ON public.staff_attendance FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Jefe can insert attendance" ON public.staff_attendance FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'jefe_local'::app_role));
CREATE POLICY "Jefe can update attendance" ON public.staff_attendance FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'jefe_local'::app_role));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_attendance;
