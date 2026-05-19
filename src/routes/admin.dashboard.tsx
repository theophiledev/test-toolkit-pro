import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, LogOut, Trophy, Users, TrendingUp, FilePlus, UserPlus, RotateCcw, BookOpen, FileText, FileArchive } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { downloadEvidencePDF } from "@/lib/exam-pdf";
import { gradeAnswer, type Question } from "@/lib/exam";

export const Route = createFileRoute("/admin/dashboard")({
  component: Dashboard,
});

type Result = {
  id: number;
  student_reg: string;
  student_name: string;
  score: number;
  total: number;
  submitted_at: string;
  answers: Record<number, string>;
  quiz_id: number | null;
};

type Quiz = { id: number; module: string; class_name: string };

function Dashboard() {
  const navigate = useNavigate();
  const [results, setResults] = useState<Result[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [resetting, setResetting] = useState<string | null>(null);
  const [printing, setPrinting] = useState<number | null>(null);
  const [quizzes, setQuizzes] = useState<Record<number, Quiz>>({});
  const [studentTotal, setStudentTotal] = useState(0);
  const [quizTakenCounts, setQuizTakenCounts] = useState<Record<number, number>>({});
  const [allowStudentDownload, setAllowStudentDownload] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("admin_ok") !== "1") {
      navigate({ to: "/admin" });
      return;
    }
    loadResults();
    supabase.from("students").select("*", { count: "exact", head: true }).then(({ count }) => {
      setStudentCount(count || 0);
      setStudentTotal(count || 0);
    });
    supabase.from("quizzes" as any).select("*").then(({ data }) => {
      const map: Record<number, Quiz> = {};
      ((data as unknown as Quiz[]) || []).forEach((q) => { map[q.id] = q; });
      setQuizzes(map);
    });
    supabase.from("settings").select("value").eq("key", "allow_student_download").maybeSingle()
      .then(({ data }) => setAllowStudentDownload(data?.value === "true"));
  }, [navigate]);

  const toggleStudentDownload = async (v: boolean) => {
    setAllowStudentDownload(v);
    await supabase.from("settings").upsert({ key: "allow_student_download", value: v ? "true" : "false" }, { onConflict: "key" });
    toast.success(v ? "Students can now download evidence" : "Student downloads disabled");
  };

  const loadResults = async () => {
    const { data } = await supabase.from("results").select("*").order("submitted_at", { ascending: false });
    const rows = (data as unknown as Result[]) || [];
    setResults(rows);
    const counts: Record<number, number> = {};
    rows.forEach((r) => { if (r.quiz_id != null) counts[r.quiz_id] = (counts[r.quiz_id] || 0) + 1; });
    setQuizTakenCounts(counts);
  };

  const resetAttempt = async (reg: string, name: string) => {
    if (!confirm(`Reset ${name} (${reg}) and allow a retake? This deletes their previous result.`)) return;
    setResetting(reg);
    const { error } = await supabase.from("results").delete().eq("student_reg", reg);
    setResetting(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`${name} can now retake the exam`);
    loadResults();
  };

  const printEvidence = async (r: Result) => {
    setPrinting(r.id);
    const quiz = r.quiz_id ? quizzes[r.quiz_id] : undefined;
    let questions: Question[] = [];
    if (r.quiz_id) {
      const { data } = await supabase.from("questions").select("*").eq("quiz_id" as any, r.quiz_id).order("ord", { ascending: true });
      questions = (data as Question[]) || [];
    }
    downloadEvidencePDF({
      student: { name: r.student_name, reg_no: r.student_reg },
      score: r.score, total: r.total,
      submitted_at: r.submitted_at,
      questions, answers: r.answers || {},
      module: quiz?.module, class_name: quiz?.class_name,
    });
    setPrinting(null);
  };

  const exportAllEvidence = async () => {
    if (!results.length) { toast.error("No submissions yet"); return; }
    setExportingAll(true);
    try {
      const quizIds = Array.from(new Set(results.map((r) => r.quiz_id).filter((x): x is number => x != null)));
      const qByQuiz: Record<number, Question[]> = {};
      for (const qid of quizIds) {
        const { data } = await supabase.from("questions").select("*").eq("quiz_id" as any, qid).order("ord", { ascending: true });
        qByQuiz[qid] = (data as Question[]) || [];
      }
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("All Students — Evidence Report", 20, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}  |  Total: ${results.length}`, 20, 28);

      results.forEach((r, idx) => {
        doc.addPage();
        let y = 20;
        const pct = r.total ? Math.round((r.score / r.total) * 100) : 0;
        const passed = pct >= 50;
        const quiz = r.quiz_id ? quizzes[r.quiz_id] : undefined;
        const questions = r.quiz_id ? (qByQuiz[r.quiz_id] || []) : [];
        const answers = r.answers || {};

        doc.setFontSize(14);
        doc.text(`Student ${idx + 1} of ${results.length} — Evidence`, 20, y); y += 8;
        doc.setLineWidth(0.4); doc.line(20, y, 190, y); y += 8;
        doc.setFontSize(11);
        const row = (k: string, v: string) => { doc.text(`${k}:`, 20, y); doc.text(v, 70, y); y += 7; };
        if (quiz) row("Module", quiz.module);
        if (quiz) row("Class", quiz.class_name);
        row("Name", r.student_name);
        row("Reg No", r.student_reg);
        row("Score", `${r.score} / ${r.total}`);
        row("Percentage", `${pct}%`);
        row("Status", passed ? "PASS" : "FAIL");
        row("Submitted", new Date(r.submitted_at).toLocaleString());

        if (questions.length) {
          y += 4;
          doc.setFontSize(12); doc.text("Answer Sheet", 20, y); y += 6;
          doc.setFontSize(9);
          const wrap = (t: string, x: number, w: number) => {
            const lines = doc.splitTextToSize(t, w);
            for (const ln of lines) { if (y > 282) { doc.addPage(); y = 20; } doc.text(ln, x, y); y += 4.5; }
          };
          questions.forEach((q, i) => {
            if (y > 265) { doc.addPage(); y = 20; }
            const ua = answers[q.id] || "(no answer)";
            const ok = q.type !== "LONG" && gradeAnswer(q, answers[q.id]);
            doc.setFont("helvetica", "bold");
            wrap(`Q${i + 1}. [${q.type}] (${q.marks ?? 1} mk) ${q.question}`, 20, 170);
            doc.setFont("helvetica", "normal");
            if (q.type === "MCQ") {
              (["a", "b", "c", "d"] as const).forEach((k) => {
                const opt = q[`option_${k}` as "option_a"];
                if (opt) wrap(`   ${k.toUpperCase()}. ${opt}`, 20, 170);
              });
            }
            doc.setTextColor(ok ? 0 : 200, ok ? 130 : 0, 0);
            wrap(`Your answer: ${ua}${q.type === "LONG" ? "" : ok ? " (correct)" : " (wrong)"}`, 20, 170);
            doc.setTextColor(0, 100, 0);
            wrap(`Correct: ${q.correct_answer || "(manually graded)"}`, 20, 170);
            doc.setTextColor(0, 0, 0);
            y += 2;
          });
        }
      });
      doc.save(`all_evidence_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Combined evidence downloaded");
    } catch (e: any) {
      toast.error(e.message || "Failed to export");
    } finally {
      setExportingAll(false);
    }
  };

  const passed = results.filter((r) => r.total && r.score / r.total >= 0.5).length;
  const failed = results.length - passed;
  const avg = results.length ? Math.round(results.reduce((a, r) => a + (r.total ? (r.score / r.total) * 100 : 0), 0) / results.length) : 0;

  const pieData = [{ name: "Pass", value: passed }, { name: "Fail", value: failed }];
  const PIE_COLORS = ["oklch(0.55 0.21 255)", "oklch(0.577 0.245 27.325)"];

  const barData = results.slice(0, 10).map((r) => ({
    name: r.student_reg.slice(-4),
    score: r.total ? Math.round((r.score / r.total) * 100) : 0,
  })).reverse();

  const exportAllPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Exam — All Results", 20, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 28);
    doc.text(`Total: ${results.length} | Pass: ${passed} | Fail: ${failed} | Avg: ${avg}%`, 20, 35);
    let y = 48;
    doc.setFont("helvetica", "bold");
    doc.text("Reg", 20, y); doc.text("Name", 50, y); doc.text("Quiz", 100, y); doc.text("Score", 145, y); doc.text("%", 170, y); doc.text("St", 185, y);
    doc.setFont("helvetica", "normal"); y += 6;
    doc.line(20, y - 2, 195, y - 2);
    results.forEach((r) => {
      if (y > 280) { doc.addPage(); y = 20; }
      const pct = r.total ? Math.round((r.score / r.total) * 100) : 0;
      const qz = r.quiz_id ? quizzes[r.quiz_id] : undefined;
      doc.text(r.student_reg, 20, y);
      doc.text((r.student_name || "").slice(0, 22), 50, y);
      doc.text((qz ? `${qz.module}` : "-").slice(0, 22), 100, y);
      doc.text(`${r.score}/${r.total}`, 145, y);
      doc.text(`${pct}%`, 170, y);
      doc.text(pct >= 50 ? "P" : "F", 185, y);
      y += 7;
    });
    doc.save("all_results.pdf");
  };

  const logout = () => { sessionStorage.removeItem("admin_ok"); navigate({ to: "/" }); };

  return (
    <main className="min-h-screen px-4 py-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Exam results & analytics</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/admin/quizzes"><Button variant="outline"><BookOpen className="h-4 w-4 mr-2" />Quizzes</Button></Link>
          <Link to="/admin/questions"><Button variant="outline"><FilePlus className="h-4 w-4 mr-2" />Questions</Button></Link>
          <Link to="/admin/students"><Button variant="outline"><UserPlus className="h-4 w-4 mr-2" />Students</Button></Link>
          <Button variant="outline" onClick={exportAllPDF}><Download className="h-4 w-4 mr-2" />Export PDF</Button>
          <Button variant="outline" onClick={exportAllEvidence} disabled={exportingAll}>
            <FileArchive className="h-4 w-4 mr-2" />{exportingAll ? "Building..." : "Download All Evidence"}
          </Button>
          <Button variant="ghost" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Logout</Button>
        </div>
      </header>

      <Card className="p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <Label htmlFor="allow-dl" className="font-semibold">Allow students to download evidence</Label>
          <p className="text-xs text-muted-foreground">When on, students can download their own PDF anytime from their result page.</p>
        </div>
        <Switch id="allow-dl" checked={allowStudentDownload} onCheckedChange={toggleStudentDownload} />
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={<Users className="h-5 w-5" />} label="Students" value={studentCount} />
        <Stat icon={<TrendingUp className="h-5 w-5" />} label="Submissions" value={results.length} />
        <Stat icon={<Trophy className="h-5 w-5" />} label="Pass Rate" value={`${results.length ? Math.round((passed / results.length) * 100) : 0}%`} />
        <Stat icon={<TrendingUp className="h-5 w-5" />} label="Average" value={`${avg}%`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Pass / Fail</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Recent scores (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="name" /><YAxis domain={[0, 100]} /><Tooltip />
              <Bar dataKey="score" fill="oklch(0.55 0.21 255)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">All Results</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reg No</TableHead><TableHead>Name</TableHead><TableHead>Quiz</TableHead>
                <TableHead>Score</TableHead><TableHead>%</TableHead><TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No submissions yet.</TableCell></TableRow>
              )}
              {results.map((r) => {
                const pct = r.total ? Math.round((r.score / r.total) * 100) : 0;
                const pass = pct >= 50;
                const qz = r.quiz_id ? quizzes[r.quiz_id] : undefined;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.student_reg}</TableCell>
                    <TableCell>{r.student_name}</TableCell>
                    <TableCell className="text-xs">{qz ? `${qz.module} — ${qz.class_name}` : "-"}</TableCell>
                    <TableCell>{r.score}/{r.total}</TableCell>
                    <TableCell>{pct}%</TableCell>
                    <TableCell><Badge variant={pass ? "default" : "destructive"}>{pass ? "PASS" : "FAIL"}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(r.submitted_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={printing === r.id}
                          title="Download evidence"
                          onClick={() => printEvidence(r)}
                        >
                          <FileText className="h-3 w-3 mr-1" />{printing === r.id ? "..." : "Print"}
                        </Button>
                        <Button size="sm" variant="outline" disabled={resetting === r.student_reg} onClick={() => resetAttempt(r.student_reg, r.student_name)}>
                          <RotateCcw className="h-3 w-3 mr-1" />{resetting === r.student_reg ? "..." : "Reset"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="text-center">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Student portal</Link>
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold leading-tight">{value}</p>
      </div>
    </Card>
  );
}
