
-- Students roster
CREATE TABLE public.students (
  reg_no TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  number INT
);

-- Questions
CREATE TYPE public.question_type AS ENUM ('MCQ','TF','MATCH','LONG');

CREATE TABLE public.questions (
  id BIGSERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  type public.question_type NOT NULL,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT,
  match_left TEXT,
  match_right TEXT,
  ord INT DEFAULT 0
);

-- Results (one per student)
CREATE TABLE public.results (
  id BIGSERIAL PRIMARY KEY,
  student_reg TEXT NOT NULL UNIQUE REFERENCES public.students(reg_no) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Anyone can read students (to verify reg) and questions (to take exam)
CREATE POLICY "students readable" ON public.students FOR SELECT USING (true);
CREATE POLICY "questions readable" ON public.questions FOR SELECT USING (true);

-- Anyone can insert their result (uniqueness on student_reg prevents retakes)
CREATE POLICY "results insertable" ON public.results FOR INSERT WITH CHECK (true);
-- Anyone can read results (admin views; admin auth handled in app)
CREATE POLICY "results readable" ON public.results FOR SELECT USING (true);

-- Seed students
INSERT INTO public.students (number, name, reg_no) VALUES
(1,'ABAHUJE Jean de Dieu','1251230052'),
(2,'CYUSA Chance','1251250019'),
(3,'IRASUBIZA Claude','1251240002'),
(4,'Ishimwe Emile','1251250111'),
(5,'MANDERA Sano','1251240003'),
(6,'MBABAZI Mignonne Mica','1251240031'),
(7,'MUGABE Dan','1251240275'),
(8,'MUNYANTORE Lilliose Peace','1251240274'),
(9,'MWINE Paul','1251230216'),
(10,'NIYERA Esther','1251230050'),
(11,'NIYIGENA Thierry','1251230192'),
(12,'NIYOGISUBIZO Emmanuel','1251240284'),
(13,'NIYONGABO Gilbert','1251230054'),
(14,'NYIRARUKUNDO Allen','1251230053'),
(15,'SHEMA Calleb','1251230046'),
(16,'TUYISHIME Sandra','1251230049'),
(17,'UMUBYEYI Claudine','1251240004'),
(18,'UWIMANA Jeannine','1251230051'),
(19,'valentin yvan Umuhire gisa','1251250135');

-- Seed questions: MCQ
INSERT INTO public.questions (ord, type, question, option_a, option_b, option_c, option_d, correct_answer) VALUES
(1,'MCQ','What is the primary purpose of performance metrics in DevOps?','To track team productivity','To measure code quality','To monitor the performance of systems and applications','To evaluate developers','C'),
(2,'MCQ','Feedback data is essential in DevOps for:','Generating revenue','Understanding user experiences','Hiring developers','Building marketing campaigns','B'),
(3,'MCQ','Why is data analysis crucial in DevOps?','To identify areas for improvement','To replace manual testing','To monitor employees','To reduce team size','A'),
(4,'MCQ','Data analysis can help DevOps teams:','Optimize resource utilization','Replace developers','Eliminate testing','Avoid monitoring','A'),
(5,'MCQ','Which of the following is NOT a type of data commonly used in DevOps?','Performance data','Financial data','Log data','Metrics data','B'),
(6,'MCQ','Monitoring tools are used to collect:','User passwords','Sales records','System metrics','Marketing data','C'),
(7,'MCQ','Regular review of performance data helps DevOps teams:','Identify trends and anomalies','Stop deployments','Increase manual work','Hide system issues','A'),
(8,'MCQ','Root cause analysis is used to:','Promote employees','Hide bugs','Increase downtime','Identify the underlying causes of performance issues','D'),
(9,'MCQ','Feedback loop integration involves:','Collecting and analyzing feedback from users','Removing testing','Disabling monitoring','Hiring more managers','A');

-- Seed questions: TRUE/FALSE
INSERT INTO public.questions (ord, type, question, correct_answer) VALUES
(10,'TF','Report findings should be presented clearly using graphs and charts.','TRUE'),
(11,'TF','Trends analysis helps identify patterns and anomalies.','TRUE'),
(12,'TF','Alerts and incidents should be documented in detail.','TRUE'),
(13,'TF','It is not necessary to investigate root causes.','FALSE'),
(14,'TF','Action items should be SMART.','TRUE');

-- Seed LONG answer questions (manually graded; auto-score ignores these)
INSERT INTO public.questions (ord, type, question) VALUES
(15,'LONG','What factors should be considered when selecting and installing monitoring tools?'),
(16,'LONG','What are the key benefits of effective DevOps monitoring?'),
(17,'LONG','What are the different types of monitoring tools used in DevOps environments?'),
(18,'LONG','Describe the installation steps for a monitoring tool.'),
(19,'LONG','What is the importance of integrating feedback loops into the DevOps process?');
