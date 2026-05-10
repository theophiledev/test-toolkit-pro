import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Award, Download } from "lucide-react";
import { type Question } from "@/lib/exam";
import { downloadEvidencePDF } from "@/lib/exam-pdf";

export const Route = createFileRoute("/result")({
  component: Result,
});

type R = {
  student: { name: string; reg_no: string };
  score: number;
  total: number;
  auto: boolean;
  submitted_at: string;
  questions?: Question[];
  answers?: Record<number, string>;
  quiz?: { module: string; class_name: string };
};

function Result() {
  const navigate = useNavigate();
  const [r, setR] = useState<R | null>(null);

  useEffect(() => {
    const s = sessionStorage.getItem("exam_result");
    if (!s) navigate({ to: "/" });
    else setR(JSON.parse(s));
  }, [navigate]);

  if (!r) return null;
  const pct = r.total ? Math.round((r.score / r.total) * 100) : 0;
  const passed = pct >= 50;

  const downloadPDF = () => downloadEvidencePDF({
    student: r.student, score: r.score, total: r.total, auto: r.auto,
    submitted_at: r.submitted_at, questions: r.questions || [], answers: r.answers || {},
    module: r.quiz?.module, class_name: r.quiz?.class_name,
  });

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <Card className="max-w-lg w-full p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-3">
          <div className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center ${passed ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"}`}>
            <Award className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold">{passed ? "Well Done!" : "Exam Complete"}</h1>
          {r.auto && <p className="text-sm text-destructive">Auto-submitted (time expired)</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase">Score</p>
            <p className="text-3xl font-bold">{r.score}/{r.total}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase">Percentage</p>
            <p className="text-3xl font-bold">{pct}%</p>
          </Card>
        </div>
        <div className="rounded-lg bg-muted p-4 text-sm space-y-1">
          {r.quiz && <div className="flex justify-between"><span>Module</span><b>{r.quiz.module}</b></div>}
          {r.quiz && <div className="flex justify-between"><span>Class</span><b>{r.quiz.class_name}</b></div>}
          <div className="flex justify-between"><span>Name</span><b>{r.student.name}</b></div>
          <div className="flex justify-between"><span>Reg No</span><b>{r.student.reg_no}</b></div>
          <div className="flex justify-between"><span>Submitted</span><b>{new Date(r.submitted_at).toLocaleString()}</b></div>
        </div>
        <p className="text-xs text-muted-foreground text-center">Note: Long-answer questions are not auto-graded.</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={downloadPDF}>
            <Download className="h-4 w-4 mr-2" /> PDF Evidence
          </Button>
          <Button className="flex-1" asChild><Link to="/">Done</Link></Button>
        </div>
      </Card>
    </main>
  );
}
