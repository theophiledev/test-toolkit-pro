import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/questions")({
  component: QuestionsAdmin,
});

type QType = "MCQ" | "TF" | "MATCH" | "LONG";

function QuestionsAdmin() {
  const navigate = useNavigate();
  const [list, setList] = useState<any[]>([]);
  const [type, setType] = useState<QType>("MCQ");
  const [question, setQuestion] = useState("");
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const [c, setC] = useState(""); const [d, setD] = useState("");
  const [correct, setCorrect] = useState("");
  const [left, setLeft] = useState(""); const [right, setRight] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("questions").select("*").order("id", { ascending: false });
    setList(data || []);
  };

  useEffect(() => {
    if (sessionStorage.getItem("admin_ok") !== "1") { navigate({ to: "/admin" }); return; }
    load();
  }, [navigate]);

  const reset = () => {
    setQuestion(""); setA(""); setB(""); setC(""); setD(""); setCorrect(""); setLeft(""); setRight("");
  };

  const save = async () => {
    if (!question.trim()) return toast.error("Question text required");
    setSaving(true);
    const payload: any = { question: question.trim(), type };
    if (type === "MCQ") {
      payload.option_a = a; payload.option_b = b; payload.option_c = c; payload.option_d = d;
      payload.correct_answer = correct.toUpperCase();
    } else if (type === "TF") {
      payload.correct_answer = correct.toUpperCase();
    } else if (type === "MATCH") {
      payload.match_left = left; payload.match_right = right;
    }
    const { error } = await supabase.from("questions").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Question added");
    reset();
    load();
  };

  return (
    <main className="min-h-screen px-4 py-6 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Questions</h1>
          <p className="text-sm text-muted-foreground">Add MCQ, True/False, Matching, or Long questions</p>
        </div>
        <Link to="/admin/dashboard"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Dashboard</Button></Link>
      </header>

      <Card className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as QType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MCQ">Multiple Choice</SelectItem>
                <SelectItem value="TF">True / False</SelectItem>
                <SelectItem value="MATCH">Matching</SelectItem>
                <SelectItem value="LONG">Long Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Question</Label>
          <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} />
        </div>
        {type === "MCQ" && (
          <div className="grid md:grid-cols-2 gap-3">
            <Input placeholder="Option A" value={a} onChange={(e) => setA(e.target.value)} />
            <Input placeholder="Option B" value={b} onChange={(e) => setB(e.target.value)} />
            <Input placeholder="Option C" value={c} onChange={(e) => setC(e.target.value)} />
            <Input placeholder="Option D" value={d} onChange={(e) => setD(e.target.value)} />
            <Input placeholder="Correct (A/B/C/D)" value={correct} onChange={(e) => setCorrect(e.target.value)} className="md:col-span-2" />
          </div>
        )}
        {type === "TF" && (
          <Input placeholder="Correct (T or F)" value={correct} onChange={(e) => setCorrect(e.target.value)} />
        )}
        {type === "MATCH" && (
          <div className="grid md:grid-cols-2 gap-3">
            <Input placeholder="Left" value={left} onChange={(e) => setLeft(e.target.value)} />
            <Input placeholder="Right (correct match)" value={right} onChange={(e) => setRight(e.target.value)} />
          </div>
        )}
        <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Add Question"}</Button>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-3">All Questions ({list.length})</h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {list.map((q) => (
            <div key={q.id} className="p-3 rounded-lg border text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium">[{q.type}] {q.question}</span>
                <span className="text-muted-foreground text-xs">#{q.id}</span>
              </div>
              {q.type === "MCQ" && <div className="text-xs text-muted-foreground mt-1">A: {q.option_a} | B: {q.option_b} | C: {q.option_c} | D: {q.option_d} | ✓ {q.correct_answer}</div>}
              {q.type === "TF" && <div className="text-xs text-muted-foreground mt-1">✓ {q.correct_answer}</div>}
              {q.type === "MATCH" && <div className="text-xs text-muted-foreground mt-1">{q.match_left} → {q.match_right}</div>}
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}