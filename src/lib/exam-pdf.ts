import jsPDF from "jspdf";
import { gradeAnswer, type Question } from "@/lib/exam";

export type EvidenceData = {
  student: { name: string; reg_no: string };
  score: number;
  total: number;
  auto?: boolean;
  submitted_at: string;
  questions: Question[];
  answers: Record<number, string>;
  module?: string;
  class_name?: string;
};

export function downloadEvidencePDF(r: EvidenceData) {
  const pct = r.total ? Math.round((r.score / r.total) * 100) : 0;
  const passed = pct >= 50;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Exam — Result Evidence", 20, 25);
  doc.setLineWidth(0.5);
  doc.line(20, 30, 190, 30);
  doc.setFontSize(12);
  let y = 45;
  const row = (k: string, v: string) => { doc.text(`${k}:`, 20, y); doc.text(v, 70, y); y += 9; };
  if (r.module) row("Module", r.module);
  if (r.class_name) row("Class", r.class_name);
  row("Student Name", r.student.name);
  row("Registration No", r.student.reg_no);
  row("Score", `${r.score} / ${r.total}`);
  row("Percentage", `${pct}%`);
  row("Status", passed ? "PASS" : "FAIL");
  row("Submitted At", new Date(r.submitted_at).toLocaleString());
  if (r.auto !== undefined) row("Submission", r.auto ? "Auto-submitted (timeout)" : "Manual");
  y += 6;
  doc.setFontSize(10);
  doc.text("This document serves as official evidence of exam submission.", 20, y);

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
      writeWrapped(`Q${i + 1}. [${q.type}] (${q.marks ?? 1} mk) ${q.question}`, 20, 170);
      doc.setFont("helvetica", "normal");

      if (q.type === "MCQ") {
        (["a", "b", "c", "d"] as const).forEach((k) => {
          const opt = q[`option_${k}` as "option_a"];
          if (opt) writeWrapped(`   ${k.toUpperCase()}. ${opt}`, 20, 170);
        });
      }

      doc.setTextColor(isCorrect ? 0 : 200, isCorrect ? 130 : 0, 0);
      writeWrapped(`Your answer: ${userAns} ${q.type === "LONG" ? "" : isCorrect ? "(correct)" : "(wrong)"}`, 20, 170);
      doc.setTextColor(0, 100, 0);
      writeWrapped(`Correct answer: ${correct}`, 20, 170);
      doc.setTextColor(0, 0, 0);
      y += 3;
    });
  }

  doc.save(`result_${r.student.reg_no}.pdf`);
}
