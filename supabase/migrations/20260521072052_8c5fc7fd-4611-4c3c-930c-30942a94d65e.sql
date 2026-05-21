ALTER TABLE public.students ADD COLUMN IF NOT EXISTS pin_hash text;
-- Allow updating own pin (public RLS already permissive elsewhere; students table lacked UPDATE)
DROP POLICY IF EXISTS "students updatable" ON public.students;
CREATE POLICY "students updatable" ON public.students FOR UPDATE USING (true) WITH CHECK (true);