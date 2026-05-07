import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { ADMIN_PASS, ADMIN_USER } from "@/lib/exam";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: Admin,
});

function Admin() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const navigate = useNavigate();

  const submit = () => {
    if (u.trim() === ADMIN_USER && p === ADMIN_PASS) {
      sessionStorage.setItem("admin_ok", "1");
      navigate({ to: "/admin/dashboard" });
    } else {
      toast.error("Invalid admin credentials");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 space-y-5 shadow-xl">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-sm text-muted-foreground">Restricted area</p>
        </div>
        <Input placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} />
        <Input placeholder="Password" type="password" value={p} onChange={(e) => setP(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        <Button className="w-full" onClick={submit}>Sign In</Button>
        <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-primary">← Back to student login</Link>
      </Card>
    </main>
  );
}
