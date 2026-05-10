
CREATE TABLE public.quizzes (
  id BIGSERIAL PRIMARY KEY,
  module TEXT NOT NULL,
  class_name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes readable" ON public.quizzes FOR SELECT TO public USING (true);
CREATE POLICY "quizzes insertable" ON public.quizzes FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "quizzes updatable" ON public.quizzes FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "quizzes deletable" ON public.quizzes FOR DELETE TO public USING (true);

INSERT INTO public.quizzes (module, class_name, active) VALUES ('DevOps', 'General', true);

ALTER TABLE public.questions ADD COLUMN quiz_id BIGINT REFERENCES public.quizzes(id) ON DELETE CASCADE;
ALTER TABLE public.results ADD COLUMN quiz_id BIGINT REFERENCES public.quizzes(id) ON DELETE SET NULL;

UPDATE public.questions SET quiz_id = (SELECT id FROM public.quizzes ORDER BY id LIMIT 1) WHERE quiz_id IS NULL;
UPDATE public.results SET quiz_id = (SELECT id FROM public.quizzes ORDER BY id LIMIT 1) WHERE quiz_id IS NULL;

ALTER TABLE public.questions ALTER COLUMN quiz_id SET NOT NULL;
