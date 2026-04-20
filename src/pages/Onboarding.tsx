import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Rocket, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "motion/react";
import React from "react";

export function Onboarding() {
  const navigate = useNavigate();
  const [sectors, setSectors] = useState<string[]>(["Fintech", "HealthTech"]);
  const [newSector, setNewSector] = useState("");
  const [agencyName, setAgencyName] = useState("");

  const addSector = () => {
    if (newSector && !sectors.includes(newSector)) {
      setSectors([...sectors, newSector]);
      setNewSector("");
    }
  };

  const removeSector = (s: string) => {
    setSectors(sectors.filter((item) => item !== s));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName) {
      toast.error("Please enter your agency name");
      return;
    }
    localStorage.setItem("agency_profile", JSON.stringify({ name: agencyName, sectors }));
    toast.success("Profile saved successfully!");
    navigate("/dashboard");
  };

  return (
    <div className="flex items-center justify-center py-6 md:py-10 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl"
      >
        <Card className="border-border shadow-md rounded-2xl bg-white overflow-hidden">
          <CardHeader className="space-y-4 pb-6 md:pb-8 border-b border-border bg-slate-50/30">
            <div className="mx-auto flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
              <Rocket className="h-6 w-6 md:h-7 md:w-7" />
            </div>
            <div className="space-y-1 text-center">
              <CardTitle className="text-xl md:text-2xl font-bold tracking-tight text-foreground">System Initialization</CardTitle>
              <CardDescription className="text-xs md:text-sm text-muted-foreground max-w-[280px] mx-auto">
                Configure your agency parameters to activate Kimo for recruitment intelligence.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 md:space-y-8 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
              <div className="space-y-2.5">
                <Label htmlFor="agencyName" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Agency Identity
                </Label>
                <Input
                  id="agencyName"
                  placeholder="Official Agency Name"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="h-10 md:h-11 border-border bg-slate-50/50 focus:border-primary focus:ring-0 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-2.5">
                <Label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Sector Specialization
                </Label>
                <div className="flex flex-wrap gap-2 py-1">
                  {sectors.map((s) => (
                    <div
                      key={s}
                      className="flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-[10px] md:text-[11px] font-bold text-primary border border-blue-100"
                    >
                      {s}
                      <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => removeSector(s)} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add sector..."
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSector())}
                    className="h-10 md:h-11 border-border rounded-lg text-sm flex-1"
                  />
                  <Button type="button" onClick={addSector} variant="outline" className="h-10 w-10 md:h-11 md:w-11 p-0 border-border rounded-lg hover:bg-primary hover:text-white transition-colors shrink-0">
                    <Plus className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 flex gap-3 text-muted-foreground border border-border italic text-xs md:text-[13px] leading-relaxed">
                <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 shrink-0 text-accent mt-0.5" />
                <p>
                  Identity mapping ensures verified executive leads are routed to your specific agency vertical.
                </p>
              </div>
            </form>
          </CardContent>
          <CardFooter className="px-6 md:px-8 pb-8">
            <Button onClick={handleSubmit} className="w-full h-11 bg-primary text-white rounded-lg font-bold text-sm shadow-sm transition-all hover:opacity-90 active:scale-95">
              Confirm Initialization
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
