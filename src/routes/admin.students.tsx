import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/students")({
  component: StudentsAdmin,
});

function StudentsAdmin() {
  const navigate = useNavigate();
  const [list, setList] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [reg, setReg] = useState("");
  const [num, setNum] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("students").select("*").order("number", { ascending: true });
    setList(data || []);
  };

  useEffect(() => {
    if (sessionStorage.getItem("admin_ok") !== "1") { navigate({ to: "/admin" }); return; }
    load();
  }, [navigate]);

  const save = async () => {
    if (!name.trim() || !reg.trim()) return toast.error("Name and registration number required");
    setSaving(true);
    const { error } = await supabase.from("students").insert({
      name: name.trim(),
      reg_no: reg.trim(),
      number: num ? parseInt(num) : null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Student added");
    setName(""); setReg(""); setNum("");
    load();
  };

  return (
    <main className="min-h-screen px-4 py-6 max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Students</h1>
          <p className="text-sm text-muted-foreground">Add students to the exam roster</p>
        </div>
        <Link to="/admin/dashboard"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Dashboard</Button></Link>
      </header>

      <Card className="p-6 space-y-4">
        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-2"><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Reg No</Label><Input value={reg} onChange={(e) => setReg(e.target.value)} /></div>
          <div className="space-y-2"><Label>Number (optional)</Label><Input type="number" value={num} onChange={(e) => setNum(e.target.value)} /></div>
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Add Student"}</Button>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-3">Roster ({list.length})</h3>
        <div className="space-y-1 max-h-[500px] overflow-y-auto text-sm">
          {list.map((s) => (
            <div key={s.reg_no} className="flex justify-between p-2 rounded border">
              <span>{s.number ? `${s.number}. ` : ""}{s.name}</span>
              <span className="font-mono text-muted-foreground">{s.reg_no}</span>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}