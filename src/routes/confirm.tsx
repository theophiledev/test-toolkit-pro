import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/confirm")({
  component: Confirm,
});

function Confirm() {
  const navigate = useNavigate();
  const [student, setStudent] = useState<{ name: string; reg_no: string } | null>(null);
  const [quiz, setQuiz] = useState<{ module: string; class_name: string } | null>(null);

  useEffect(() => {
    const s = sessionStorage.getItem("exam_student");
    const q = sessionStorage.getItem("exam_quiz");
    if (!s || !q) navigate({ to: "/" });
    else { setStudent(JSON.parse(s)); setQuiz(JSON.parse(q)); }
  }, [navigate]);

  if (!student || !quiz) return null;

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-2xl font-bold">Confirm Your Identity</h1>
        </div>
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-semibold">{student.name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Reg No</span><span className="font-semibold">{student.reg_no}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Module</span><span className="font-semibold">{quiz.module}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Class</span><span className="font-semibold">{quiz.class_name}</span></div>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• You have <b>30 minutes</b> to complete the exam.</p>
          <p>• The exam will <b>auto-submit</b> when time expires.</p>
          <p>• You can only take this exam <b>once</b>.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => navigate({ to: "/" })}>Not me</Button>
          <Button className="flex-1" onClick={() => navigate({ to: "/exam" })}>Start Exam</Button>
        </div>
      </Card>
    </main>
  );
}
