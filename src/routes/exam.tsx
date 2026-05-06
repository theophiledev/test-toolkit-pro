import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { EXAM_DURATION_SECONDS, formatTime, gradeAnswer, type Question } from "@/lib/exam";

export const Route = createFileRoute("/exam")({
  component: Exam,
});

function Exam() {
  const navigate = useNavigate();
  const [student, setStudent] = useState<{ name: string; reg_no: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    const s = sessionStorage.getItem("exam_student");
    if (!s) {
      navigate({ to: "/" });
      return;
    }
    setStudent(JSON.parse(s));
    supabase
      .from("questions")
      .select("*")
      .order("ord", { ascending: true })
      .then(({ data }) => setQuestions((data as Question[]) || []));
  }, [navigate]);

  const handleSubmit = async (auto = false) => {
    if (submittedRef.current || !student) return;
    submittedRef.current = true;
    setSubmitting(true);

    const gradable = questions.filter((q) => q.type !== "LONG");
    let score = 0;
    for (const q of gradable) if (gradeAnswer(q, answers[q.id])) score++;

    const { error } = await supabase.from("results").insert({
      student_reg: student.reg_no,
      student_name: student.name,
      score,
      total: gradable.length,
      answers,
    });

    if (error) {
      toast.error("Submit failed: " + error.message);
      submittedRef.current = false;
      setSubmitting(false);
      return;
    }

    sessionStorage.setItem("exam_result", JSON.stringify({
      student, score, total: gradable.length, auto,
      submitted_at: new Date().toISOString(),
    }));
    sessionStorage.removeItem("exam_student");
    navigate({ to: "/result" });
  };

  useEffect(() => {
    if (questions.length === 0) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          handleSubmit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length]);

  if (!student || questions.length === 0) {
    return <main className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading exam...</p></main>;
  }

  const lowTime = timeLeft < 60;

  return (
    <main className="min-h-screen pb-32">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-semibold leading-tight">{student.name}</p>
            <p className="text-xs text-muted-foreground">{student.reg_no}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold ${lowTime ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary text-primary-foreground"}`}>
            <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {questions.map((q, i) => (
          <Card key={q.id} className="p-5 space-y-4">
            <div className="flex gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">{i + 1}</span>
              <div className="flex-1">
                <p className="font-medium">{q.question}</p>
                <p className="text-xs text-muted-foreground mt-1">{q.type === "LONG" ? "Long answer (manually graded)" : q.type}</p>
              </div>
            </div>

            {q.type === "MCQ" && (
              <RadioGroup value={answers[q.id] || ""} onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}>
                {(["A", "B", "C", "D"] as const).map((k) => {
                  const label = q[`option_${k.toLowerCase()}` as "option_a"];
                  if (!label) return null;
                  return (
                    <div key={k} className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted">
                      <RadioGroupItem value={k} id={`q${q.id}-${k}`} />
                      <Label htmlFor={`q${q.id}-${k}`} className="flex-1 cursor-pointer"><b>{k}.</b> {label}</Label>
                    </div>
                  );
                })}
              </RadioGroup>
            )}

            {q.type === "TF" && (
              <RadioGroup value={answers[q.id] || ""} onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}>
                {(["TRUE", "FALSE"] as const).map((k) => (
                  <div key={k} className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted">
                    <RadioGroupItem value={k} id={`q${q.id}-${k}`} />
                    <Label htmlFor={`q${q.id}-${k}`} className="cursor-pointer">{k}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {(q.type === "MATCH" || q.type === "LONG") && (
              <Textarea
                placeholder="Type your answer..."
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                rows={q.type === "LONG" ? 5 : 3}
              />
            )}
          </Card>
        ))}

        <Button className="w-full" size="lg" onClick={() => handleSubmit(false)} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Exam"}
        </Button>
      </div>
    </main>
  );
}
