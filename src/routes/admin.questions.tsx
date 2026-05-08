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
import { ArrowLeft, Pencil, Trash2, X } from "lucide-react";

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
  const [marks, setMarks] = useState<number>(1);
  const [editingId, setEditingId] = useState<number | null>(null);
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
    setMarks(1); setEditingId(null); setType("MCQ");
  };

  const save = async () => {
    if (!question.trim()) return toast.error("Question text required");
    setSaving(true);
    const payload: any = { question: question.trim(), type, marks: Number(marks) || 1 };
    if (type === "MCQ") {
      payload.option_a = a; payload.option_b = b; payload.option_c = c; payload.option_d = d;
      payload.correct_answer = correct.toUpperCase();
    } else if (type === "TF") {
      payload.correct_answer = correct.toUpperCase();
    } else if (type === "MATCH") {
      payload.match_left = left; payload.match_right = right;
    }
    const { error } = editingId
      ? await supabase.from("questions").update(payload).eq("id", editingId)
      : await supabase.from("questions").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Question updated" : "Question added");
    reset();
    load();
  };

  const startEdit = (q: any) => {
    setEditingId(q.id);
    setType(q.type);
    setQuestion(q.question || "");
    setA(q.option_a || ""); setB(q.option_b || ""); setC(q.option_c || ""); setD(q.option_d || "");
    setCorrect(q.correct_answer || "");
    setLeft(q.match_left || ""); setRight(q.match_right || "");
    setMarks(q.marks ?? 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this question? This cannot be undone.")) return;
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Question deleted");
    if (editingId === id) reset();
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
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{editingId ? `Editing question #${editingId}` : "Add new question"}</h3>
          {editingId && <Button variant="ghost" size="sm" onClick={reset}><X className="h-4 w-4 mr-1" />Cancel</Button>}
        </div>
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
          <div className="space-y-2">
            <Label>Marks</Label>
            <Input type="number" min={1} value={marks} onChange={(e) => setMarks(Number(e.target.value))} />
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
        <Button onClick={save} disabled={saving}>{saving ? "Saving..." : editingId ? "Update Question" : "Add Question"}</Button>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-3">All Questions ({list.length})</h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {list.map((q) => (
            <div key={q.id} className="p-3 rounded-lg border text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium flex-1">[{q.type}] ({q.marks ?? 1} mk) {q.question}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(q)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(q.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  <span className="text-muted-foreground text-xs ml-1">#{q.id}</span>
                </div>
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