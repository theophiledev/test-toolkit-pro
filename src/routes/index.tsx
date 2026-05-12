import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, ShieldCheck, BookOpen } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Login,
});

type Quiz = { id: number; module: string; class_name: string; active: boolean };

function Login() {
  const [reg, setReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"reg" | "quiz">("reg");
  const [student, setStudent] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (!reg.trim()) return toast.error("Enter your registration number");
    setLoading(true);
    const r = reg.trim();
    const { data: stu } = await supabase.from("students").select("*").eq("reg_no", r).maybeSingle();
    if (!stu) { setLoading(false); return toast.error("Registration number not found in roster"); }
    const { data: qz } = await supabase.from("quizzes" as any).select("*").eq("active", true).order("id", { ascending: false });
    const list = (qz as unknown as Quiz[]) || [];
    if (list.length === 0) { setLoading(false); return toast.error("No active quiz available. Contact your administrator."); }
    setStudent(stu);
    setQuizzes(list);
    setStep("quiz");
    setLoading(false);
  };

  const pickQuiz = async (q: Quiz) => {
    const { data: existing } = await supabase
      .from("results")
      .select("*")
      .eq("student_reg", student.reg_no)
      .eq("quiz_id" as any, q.id)
      .maybeSingle();
    if (existing) {
      toast.error("You already took this quiz. Results are released by your administrator.");
      return;
    }
    sessionStorage.setItem("exam_student", JSON.stringify(student));
    sessionStorage.setItem("exam_quiz", JSON.stringify(q));
    navigate({ to: "/confirm" });
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Exam Portal</h1>
          <p className="text-muted-foreground">{step === "reg" ? "Sign in with your registration number." : "Choose your quiz."}</p>
        </div>
        {step === "reg" ? (
          <Card className="p-6 space-y-4 shadow-xl">
            <div className="space-y-2">
              <label className="text-sm font-medium">Registration Number</label>
              <Input placeholder="e.g. 1251230052" value={reg} onChange={(e) => setReg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleVerify()} />
            </div>
            <Button className="w-full" size="lg" onClick={handleVerify} disabled={loading}>
              {loading ? "Verifying..." : "Continue"}
            </Button>
          </Card>
        ) : (
          <Card className="p-6 space-y-3 shadow-xl">
            <p className="text-sm">Welcome <b>{student?.name}</b></p>
            <div className="space-y-2">
              {quizzes.map((q) => (
                <button key={q.id} onClick={() => pickQuiz(q)} className="w-full text-left p-4 rounded-lg border hover:border-primary hover:bg-muted transition flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{q.module}</p>
                    <p className="text-xs text-muted-foreground">{q.class_name}</p>
                  </div>
                </button>
              ))}
            </div>
            <Button variant="ghost" className="w-full" onClick={() => setStep("reg")}>Back</Button>
          </Card>
        )}
        <div className="text-center">
          <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ShieldCheck className="h-4 w-4" /> Admin Login
          </Link>
        </div>
      </div>
    </main>
  );
}
