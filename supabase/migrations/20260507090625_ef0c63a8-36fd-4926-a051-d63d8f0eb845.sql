
ALTER TABLE public.results DROP CONSTRAINT IF EXISTS results_student_reg_key;

CREATE POLICY "questions insertable" ON public.questions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "students insertable" ON public.students FOR INSERT TO public WITH CHECK (true);
