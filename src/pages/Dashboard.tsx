import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Briefcase, Users, TrendingUp, ArrowRight, Loader2, Sparkles, MapPin, Building2, BarChart3, Clock, Mail, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { generateJobLeads } from "@/src/services/aiService";
import { rankLeads } from "@/src/lib/matching";

interface JobLead {
  id: string;
  company: string;
  title: string;
  description: string;
  industry: string;
  seniority: string;
  salary: string;
  location: string;
  requiredSkills: string[];
  scrapedAt: string;
  sourceUrl: string;
  matchScore?: number;
  leads: { name: string; role: string; type: string }[];
}

interface LeadCardProps {
  lead: JobLead;
  index: number;
  key?: React.Key;
}

function LeadCard({ lead, index }: LeadCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="group border-border hover:shadow-md transition-all duration-200 bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            <div className="p-5 md:p-6 flex-1 space-y-4">
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-[10px] font-black tracking-widest px-2 py-0.5">
                       MATCH {lead.matchScore}%
                    </Badge>
                    {lead.matchScore && lead.matchScore > 80 && (
                      <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    )}
                  </div>
                  <h3 className="text-sm md:text-[15px] font-bold text-foreground leading-snug">{lead.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{lead.company}</span>
                    <span className="hidden md:inline text-muted-foreground/30">&bull;</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.location}</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-primary whitespace-nowrap">
                  {lead.salary}
                </span>
              </div>
              
              <p className="text-[11px] md:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {lead.description}
              </p>

              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold tracking-tight">
                  {lead.industry}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold tracking-tight">
                  {lead.seniority}
                </span>
                {lead.requiredSkills.slice(0, 3).map(req => (
                  <span key={req} className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-[9px] font-bold tracking-tight">
                    {req}
                  </span>
                ))}
              </div>
            </div>
            <div className="lg:w-64 bg-slate-50/50 p-5 md:p-6 border-t lg:border-t-0 lg:border-l border-border flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">Targeted Leads</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {lead.leads.map((contact, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-white border border-border flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0 shadow-sm">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-bold text-foreground truncate">{contact.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate font-medium">{contact.role}</span>
                        </div>
                        <Dialog>
                          <DialogTrigger
                            render={
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg shrink-0" />
                            }
                          >
                            <Mail className="h-3.5 w-3.5 text-primary" />
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Contact {contact.name}</DialogTitle>
                              <DialogDescription>
                                Compose a message to pitch your relevant candidates for the {lead.title} role.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="flex items-center gap-2 mb-2 p-3 bg-slate-50 rounded-lg border border-border">
                                <div className="h-8 w-8 rounded-full bg-white border border-border flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0 shadow-sm">
                                  {contact.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-foreground truncate">{contact.name}</span>
                                  <span className="text-[10px] text-muted-foreground truncate font-medium">{contact.role} @ {lead.company}</span>
                                </div>
                              </div>
                              <Textarea
                                placeholder="Draft your message..."
                                className="min-h-[150px] resize-none text-sm"
                                defaultValue={`Hi ${contact.name.split(' ')[0]},\n\nI noticed the ${lead.title} opening at ${lead.company} and we have strong candidates who perfectly match your requirements, particularly in ${lead.industry}.\n\nAre you open to seeing some profiles?`}
                              />
                            </div>
                            <DialogFooter>
                              <Button type="submit" className="w-full sm:w-auto flex items-center gap-2 text-xs font-bold" onClick={() => toast.success("Message queued for delivery!")}>
                                <Send className="h-3.5 w-3.5" />
                                Send Message
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between text-[9px] font-bold text-muted-foreground opacity-70">
                 <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(lead.scrapedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </div>
                 <div className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors">
                    Via OpenClaw
                 </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function Dashboard() {
  const [profile, setProfile] = useState<{ name: string; sectors: string[] } | null>(null);
  const [leads, setLeads] = useState<JobLead[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("agency_profile");
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  }, []);

  const triggerDiscover = async () => {
    if (!profile) return;
    setIsSearching(true);
    try {
      const results = await generateJobLeads(
        profile.sectors.join(", "),
        profile.name
      );
      
      const ranked = rankLeads(profile, results);
      setLeads(ranked);
      setIsSearching(false);
      
      if (ranked.length > 0) {
        toast.success(`OpenClaw identified and ranked ${ranked.length} strategic leads!`);
      } else {
        toast.error("OpenClaw couldn't find matching leads in the current scrape.");
      }
    } catch (error) {
      console.error(error);
      setIsSearching(false);
      toast.error("Failed to connect to AI agent");
    }
  };

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="p-6 bg-white rounded-3xl border border-neutral-200 shadow-xl max-w-md">
          <Briefcase className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
          <h2 className="text-2xl font-bold">Welcome to TalentLink</h2>
          <p className="text-neutral-500 mt-2">Finish your agency onboarding to start discovering leads.</p>
          <Button onClick={() => window.location.href = "/onboarding"} className="mt-6 w-full bg-neutral-900 rounded-xl py-6">
            Go to Onboarding <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Recruitment Intelligence
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Real-time job mapping for <strong className="text-foreground">{profile.name}</strong>
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-accent rounded-full text-[10px] md:text-xs font-bold border border-emerald-100 shadow-sm w-fit">
            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            OpenClaw Scanning LinkedIn
          </div>
          <Button 
            onClick={triggerDiscover} 
            disabled={isSearching}
            className="h-9 md:h-10 px-4 md:px-6 bg-primary text-white rounded-lg font-bold text-[11px] md:text-xs transition-all hover:opacity-90 active:scale-95 flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            New Search
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-none bg-transparent">
            <Tabs defaultValue="all" className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-transparent border border-border p-1 rounded-xl h-10">
                  <TabsTrigger value="all" className="rounded-lg px-5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Active Opportunities</TabsTrigger>
                  <TabsTrigger value="all-leads" className="rounded-lg px-5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white">All Leads</TabsTrigger>
                  <TabsTrigger value="specialized" className="rounded-lg px-5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Profile Matched</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="mt-0 space-y-4">
                <AnimatePresence mode="popLayout">
                  {leads.filter(l => (l.matchScore || 0) > 60).length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-24 bg-white border border-dashed border-border rounded-2xl"
                    >
                      <Search className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground font-medium text-sm">No high-match opportunities found. Try a new search.</p>
                    </motion.div>
                  ) : (
                    leads.filter(l => (l.matchScore || 0) > 60).map((lead, index) => (
                      <LeadCard key={lead.id} lead={lead} index={index} />
                    ))
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="all-leads" className="mt-0 space-y-4">
                <AnimatePresence mode="popLayout">
                  {leads.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-24 bg-white border border-dashed border-border rounded-2xl"
                    >
                      <Search className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground font-medium text-sm">No results yet. Start a discovery scan.</p>
                    </motion.div>
                  ) : (
                    leads.map((lead, index) => (
                      <LeadCard key={lead.id} lead={lead} index={index} />
                    ))
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="specialized" className="mt-0 space-y-4">
                <AnimatePresence mode="popLayout">
                  {leads.filter(l => (l.matchScore || 0) > 85).length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-24 bg-white border border-dashed border-border rounded-2xl"
                    >
                      <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground font-medium text-sm">No perfect profile matches identified yet.</p>
                    </motion.div>
                  ) : (
                    leads.filter(l => (l.matchScore || 0) > 85).map((lead, index) => (
                      <LeadCard key={lead.id} lead={lead} index={index} />
                    ))
                  )}
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold text-foreground">Market Pulse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="text-xs font-semibold text-muted-foreground">Volume Insight</span>
                <span className="text-sm font-bold text-accent">+14% Growth</span>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                   LinkedIn volume for <strong>FinTech</strong> roles increased significantly this week. Companies are actively scaling enterprise teams.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                   <Badge variant="secondary" className="bg-blue-50 text-primary border-0 text-[9px] font-bold rounded-md">SCALING</Badge>
                   <Badge variant="secondary" className="bg-emerald-50 text-accent border-0 text-[9px] font-bold rounded-md">TRENDING</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border shadow-sm rounded-2xl bg-white p-6">
             <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-sm">Strategic Activity</h4>
                <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
             </div>
             <div className="space-y-6">
                <div className="flex gap-4">
                   <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-muted-foreground shrink-0 border border-border/50">SJ</div>
                   <div className="space-y-1">
                      <p className="text-xs font-bold">Sarah Jenkins</p>
                      <p className="text-[10px] text-muted-foreground font-medium">Head of Talent mapped @ Stripe</p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center font-bold text-xs text-primary shrink-0 border border-blue-100">MT</div>
                   <div className="space-y-1">
                      <p className="text-xs font-bold">Mark Thompson</p>
                      <p className="text-[10px] text-muted-foreground font-medium">Verified C-Level Strategy Lead</p>
                   </div>
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
