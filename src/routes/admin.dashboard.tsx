import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, LogOut, Trophy, Users, TrendingUp, FilePlus, UserPlus } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import jsPDF from "jspdf";

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
};

function Dashboard() {
  const navigate = useNavigate();
  const [results, setResults] = useState<Result[]>([]);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem("admin_ok") !== "1") {
      navigate({ to: "/admin" });
      return;
    }
    supabase.from("results").select("*").order("submitted_at", { ascending: false }).then(({ data }) => setResults((data as Result[]) || []));
    supabase.from("students").select("*", { count: "exact", head: true }).then(({ count }) => setStudentCount(count || 0));
  }, [navigate]);

  const passed = results.filter((r) => r.total && r.score / r.total >= 0.5).length;
  const failed = results.length - passed;
  const avg = results.length ? Math.round(results.reduce((a, r) => a + (r.total ? (r.score / r.total) * 100 : 0), 0) / results.length) : 0;

  const pieData = [
    { name: "Pass", value: passed },
    { name: "Fail", value: failed },
  ];
  const PIE_COLORS = ["oklch(0.55 0.21 255)", "oklch(0.577 0.245 27.325)"];

  const barData = results.slice(0, 10).map((r) => ({
    name: r.student_reg.slice(-4),
    score: r.total ? Math.round((r.score / r.total) * 100) : 0,
  })).reverse();

  const exportAllPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("DevOps Exam — All Results", 20, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 28);
    doc.text(`Total submissions: ${results.length} | Pass: ${passed} | Fail: ${failed} | Avg: ${avg}%`, 20, 35);
    let y = 48;
    doc.setFont("helvetica", "bold");
    doc.text("Reg No", 20, y); doc.text("Name", 60, y); doc.text("Score", 130, y); doc.text("%", 155, y); doc.text("Status", 170, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    doc.line(20, y - 2, 195, y - 2);
    results.forEach((r) => {
      if (y > 280) { doc.addPage(); y = 20; }
      const pct = r.total ? Math.round((r.score / r.total) * 100) : 0;
      doc.text(r.student_reg, 20, y);
      doc.text((r.student_name || "").slice(0, 30), 60, y);
      doc.text(`${r.score}/${r.total}`, 130, y);
      doc.text(`${pct}%`, 155, y);
      doc.text(pct >= 50 ? "PASS" : "FAIL", 170, y);
      y += 7;
    });
    doc.save("all_results.pdf");
  };

  const logout = () => {
    sessionStorage.removeItem("admin_ok");
    navigate({ to: "/" });
  };

  return (
    <main className="min-h-screen px-4 py-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Exam results & analytics</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/questions"><Button variant="outline"><FilePlus className="h-4 w-4 mr-2" />Questions</Button></Link>
          <Link to="/admin/students"><Button variant="outline"><UserPlus className="h-4 w-4 mr-2" />Students</Button></Link>
          <Button variant="outline" onClick={exportAllPDF}><Download className="h-4 w-4 mr-2" />Export PDF</Button>
          <Button variant="ghost" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Logout</Button>
        </div>
      </header>

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
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Recent scores (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
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
                <TableHead>Reg No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No submissions yet.</TableCell></TableRow>
              )}
              {results.map((r) => {
                const pct = r.total ? Math.round((r.score / r.total) * 100) : 0;
                const pass = pct >= 50;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.student_reg}</TableCell>
                    <TableCell>{r.student_name}</TableCell>
                    <TableCell>{r.score}/{r.total}</TableCell>
                    <TableCell>{pct}%</TableCell>
                    <TableCell><Badge variant={pass ? "default" : "destructive"}>{pass ? "PASS" : "FAIL"}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(r.submitted_at).toLocaleString()}</TableCell>
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
