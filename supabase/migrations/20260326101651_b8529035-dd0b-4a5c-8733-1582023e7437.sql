
CREATE TABLE public.weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  week_end date NOT NULL,
  report_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(week_start)
);

ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read weekly reports"
  ON public.weekly_reports FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role can manage weekly reports"
  ON public.weekly_reports FOR ALL TO service_role
  USING (true) WITH CHECK (true);
