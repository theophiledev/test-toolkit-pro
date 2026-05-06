import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Award, Download } from "lucide-react";
import jsPDF from "jspdf";
import { gradeAnswer, type Question } from "@/lib/exam";

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

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("DevOps Exam — Result Evidence", 20, 25);
    doc.setLineWidth(0.5);
    doc.line(20, 30, 190, 30);
    doc.setFontSize(12);
    let y = 45;
    const row = (k: string, v: string) => { doc.text(`${k}:`, 20, y); doc.text(v, 70, y); y += 10; };
    row("Student Name", r.student.name);
    row("Registration No", r.student.reg_no);
    row("Score", `${r.score} / ${r.total}`);
    row("Percentage", `${pct}%`);
    row("Status", passed ? "PASS" : "FAIL");
    row("Submitted At", new Date(r.submitted_at).toLocaleString());
    row("Submission", r.auto ? "Auto-submitted (timeout)" : "Manual");
    y += 10;
    doc.setFontSize(10);
    doc.text("This document serves as official evidence of exam submission.", 20, y);
    y += 10;

    const questions = r.questions || [];
    const answers = r.answers || {};
    if (questions.length) {
      doc.addPage();
      y = 20;
      doc.setFontSize(14);
      doc.text("Answer Sheet", 20, y);
      y += 8;
      doc.setLineWidth(0.3);
      doc.line(20, y, 190, y);
      y += 8;
      doc.setFontSize(10);

      const writeWrapped = (text: string, x: number, maxW: number) => {
        const lines = doc.splitTextToSize(text, maxW);
        for (const ln of lines) {
          if (y > 280) { doc.addPage(); y = 20; }
          doc.text(ln, x, y);
          y += 5;
        }
      };

      questions.forEach((q, i) => {
        if (y > 260) { doc.addPage(); y = 20; }
        const userAns = answers[q.id] || "(no answer)";
        const correct = q.correct_answer || "(manually graded)";
        const isCorrect = q.type !== "LONG" && gradeAnswer(q, answers[q.id]);

        doc.setFont("helvetica", "bold");
        writeWrapped(`Q${i + 1}. [${q.type}] ${q.question}`, 20, 170);
        doc.setFont("helvetica", "normal");

        if (q.type === "MCQ") {
          (["a", "b", "c", "d"] as const).forEach((k) => {
            const opt = q[`option_${k}` as "option_a"];
            if (opt) writeWrapped(`   ${k.toUpperCase()}. ${opt}`, 20, 170);
          });
        }

        doc.setTextColor(isCorrect ? 0 : 200, isCorrect ? 130 : 0, 0);
        writeWrapped(`Your answer: ${userAns} ${q.type === "LONG" ? "" : isCorrect ? "✓" : "✗"}`, 20, 170);
        doc.setTextColor(0, 100, 0);
        writeWrapped(`Correct answer: ${correct}`, 20, 170);
        doc.setTextColor(0, 0, 0);
        y += 3;
      });
    }

    doc.save(`result_${r.student.reg_no}.pdf`);
  };

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
