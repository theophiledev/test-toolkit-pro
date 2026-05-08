
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS marks integer NOT NULL DEFAULT 1;

CREATE POLICY "questions updatable" ON public.questions FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "questions deletable" ON public.questions FOR DELETE TO public USING (true);

CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value text NOT NULL
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings readable" ON public.settings FOR SELECT TO public USING (true);
CREATE POLICY "settings insertable" ON public.settings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "settings updatable" ON public.settings FOR UPDATE TO public USING (true) WITH CHECK (true);

INSERT INTO public.settings (key, value) VALUES ('quiz_active', 'true') ON CONFLICT (key) DO NOTHING;
