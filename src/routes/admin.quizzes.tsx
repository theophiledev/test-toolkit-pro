import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/admin/quizzes")({
  component: QuizzesAdmin,
});

type Quiz = { id: number; module: string; class_name: string; active: boolean };

function QuizzesAdmin() {
  const navigate = useNavigate();
  const [list, setList] = useState<Quiz[]>([]);
  const [module, setModule] = useState("");
  const [className, setClassName] = useState("");
  const [active, setActive] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("quizzes" as any).select("*").order("id", { ascending: false });
    setList((data as unknown as Quiz[]) || []);
  };

  useEffect(() => {
    if (sessionStorage.getItem("admin_ok") !== "1") { navigate({ to: "/admin" }); return; }
    load();
  }, [navigate]);

  const reset = () => { setModule(""); setClassName(""); setActive(true); setEditingId(null); };

  const save = async () => {
    if (!module.trim() || !className.trim()) return toast.error("Module and class are required");
    setSaving(true);
    const payload = { module: module.trim(), class_name: className.trim(), active };
    const { error } = editingId
      ? await supabase.from("quizzes" as any).update(payload).eq("id", editingId)
      : await supabase.from("quizzes" as any).insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Quiz updated" : "Quiz created");
    reset();
    load();
  };

  const startEdit = (q: Quiz) => {
    setEditingId(q.id); setModule(q.module); setClassName(q.class_name); setActive(q.active);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this quiz? All its questions and result links will be removed/unlinked.")) return;
    const { error } = await supabase.from("quizzes" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Quiz deleted");
    if (editingId === id) reset();
    load();
  };

  return (
    <main className="min-h-screen px-4 py-6 max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Quizzes</h1>
          <p className="text-sm text-muted-foreground">Create quizzes by module and class</p>
        </div>
        <Link to="/admin/dashboard"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Dashboard</Button></Link>
      </header>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{editingId ? `Editing quiz #${editingId}` : "Create a new quiz"}</h3>
          {editingId && <Button variant="ghost" size="sm" onClick={reset}><X className="h-4 w-4 mr-1" />Cancel</Button>}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Module</Label>
            <Input placeholder="e.g. DevOps Fundamentals" value={module} onChange={(e) => setModule(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Class</Label>
            <Input placeholder="e.g. Year 3 IT-A" value={className} onChange={(e) => setClassName(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={active} onCheckedChange={setActive} />
          <Label>Active (visible to students)</Label>
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Saving..." : editingId ? "Update Quiz" : "Create Quiz"}</Button>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-3">All Quizzes ({list.length})</h3>
        <div className="space-y-2">
          {list.length === 0 && <p className="text-sm text-muted-foreground">No quizzes yet.</p>}
          {list.map((q) => (
            <div key={q.id} className="p-3 rounded-lg border flex items-center justify-between gap-2">
              <div className="text-sm">
                <p className="font-medium">{q.module} <span className="text-muted-foreground">— {q.class_name}</span></p>
                <p className="text-xs text-muted-foreground">#{q.id} · {q.active ? "Active" : "Inactive"}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => startEdit(q)}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
