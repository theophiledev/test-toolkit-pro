import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Login,
});

function Login() {
  const [reg, setReg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStart = async () => {
    if (!reg.trim()) return toast.error("Enter your registration number");
    setLoading(true);
    const r = reg.trim();
    const { data: student } = await supabase.from("students").select("*").eq("reg_no", r).maybeSingle();
    if (!student) {
      setLoading(false);
      return toast.error("Registration number not found in roster");
    }
    sessionStorage.setItem("exam_student", JSON.stringify(student));
    setLoading(false);
    navigate({ to: "/confirm" });
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">DevOps Exam Portal</h1>
          <p className="text-muted-foreground">Sign in with your registration number to begin.</p>
        </div>
        <Card className="p-6 space-y-4 shadow-xl">
          <div className="space-y-2">
            <label className="text-sm font-medium">Registration Number</label>
            <Input
              placeholder="e.g. 1251230052"
              value={reg}
              onChange={(e) => setReg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />
          </div>
          <Button className="w-full" size="lg" onClick={handleStart} disabled={loading}>
            {loading ? "Verifying..." : "Continue"}
          </Button>
        </Card>
        <div className="text-center">
          <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ShieldCheck className="h-4 w-4" /> Admin Login
          </Link>
        </div>
      </div>
    </main>
  );
}
