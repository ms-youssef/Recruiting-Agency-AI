import { Link, useLocation } from "react-router-dom";
import { Briefcase, LayoutDashboard, UserPlus, Globe, Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Agency Profile", path: "/onboarding", icon: UserPlus },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
          <Globe className="h-6 w-6" />
        </div>
        <span className="text-xl font-extrabold tracking-tight text-foreground">TalentLink</span>
      </div>

      <div className="flex-1 space-y-8">
        <div className="space-y-4">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Recruitment Bridge
          </p>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group",
                  location.pathname === item.path 
                    ? "bg-secondary text-primary shadow-sm" 
                    : "text-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("h-4 w-4", location.pathname === item.path ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                </div>
                {location.pathname === item.path && <ChevronRight className="h-4 w-4 text-primary/50" />}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Connect Intelligence
          </p>
          <div className="space-y-1">
             <div className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg cursor-not-allowed opacity-50 group">
               <Briefcase className="h-4 w-4 text-muted-foreground" />
               Contract Manager
             </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <div className="rounded-2xl bg-slate-50 border border-border p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-foreground uppercase tracking-widest">OpenClaw Live</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
            Active indexing LinkedIn Data Pool. Last global sync: 2 mins ago.
          </p>
          <Separator className="bg-border/50" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground">Status</span>
            <span className="text-[10px] font-black text-emerald-600">OPERATIONAL</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 h-screen sticky top-0 border-r border-border bg-white flex-col shrink-0">
        <div className="p-8 h-full">
          <NavContent />
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-border px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Globe className="h-5 w-5" />
          </div>
          <span className="text-lg font-extrabold tracking-tight">TalentLink</span>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl border border-border hover:bg-muted"
              />
            }
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[350px] p-6">
            <SheetHeader className="hidden">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
