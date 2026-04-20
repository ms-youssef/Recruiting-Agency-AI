import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Briefcase, Users, TrendingUp, ArrowRight, Loader2, Sparkles, MapPin, Building2, BarChart3, Clock, Mail, Send, Globe, Linkedin, Phone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { fetchLeadStatus, fetchRunStatus, generateJobLeads } from "@/src/services/aiService";
import { rankLeads } from "@/src/lib/matching";
import type { JobLead, LeadRunSummary, LeadStatusSnapshot } from "@/src/types";

interface LeadCardProps {
  lead: JobLead;
  index: number;
  key?: React.Key;
}

function LeadCard({ lead, index }: LeadCardProps) {
  const liveStatus = (lead as any).liveStatus;
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
                {liveStatus?.qualification_status && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold tracking-tight">
                    {liveStatus.qualification_status}
                  </span>
                )}
                {liveStatus?.dedupe_status && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[9px] font-bold tracking-tight">
                    {liveStatus.dedupe_status}
                  </span>
                )}
                {liveStatus?.enrichment_status && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold tracking-tight">
                    {liveStatus.enrichment_status}
                  </span>
                )}
                {lead.requiredSkills.slice(0, 3).map(req => (
                  <span key={req} className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-[9px] font-bold tracking-tight">
                    {req}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-muted-foreground">
                <div className="rounded-xl border border-border bg-slate-50/60 p-3 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-foreground">Company Intel</div>
                  <p className="leading-relaxed">{lead.companyInfo.about}</p>
                  <div><strong>Size:</strong> {lead.companyInfo.companySize}</div>
                  <div><strong>Employees:</strong> {lead.companyInfo.employeeCount}</div>
                  <div><strong>HQ:</strong> {lead.companyInfo.headquarters}</div>
                  <div className="flex flex-col gap-1 pt-1">
                    <a href={lead.companyInfo.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Globe className="h-3 w-3" /> Company website
                    </a>
                    <a href={lead.companyInfo.linkedinProfile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Linkedin className="h-3 w-3" /> Company LinkedIn
                    </a>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-slate-50/60 p-3 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-foreground">Hiring Source</div>
                  <div><strong>Role page:</strong> <a href={lead.sourceUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Open source link</a></div>
                  <div><strong>Last scan:</strong> {new Date(lead.scrapedAt).toLocaleString()}</div>
                  <div><strong>Agent:</strong> Kimo</div>
                </div>
              </div>
            </div>
            <div className="lg:w-64 bg-slate-50/50 p-5 md:p-6 border-t lg:border-t-0 lg:border-l border-border flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">Targeted Leads</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {lead.leads.map((contact, i) => (
                    <div key={i} className="flex flex-col gap-2 rounded-xl border border-border bg-white/80 p-3">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-white border border-border flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0 shadow-sm">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1 gap-1">
                          <span className="text-xs font-bold text-foreground truncate">{contact.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate font-medium">{contact.role}</span>
                          <span className="text-[10px] text-muted-foreground leading-relaxed">{contact.bio || "Bio pending enrichment."}</span>
                          <div className="flex flex-col gap-1 pt-1 text-[10px]">
                            {contact.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {contact.email}</span>}
                            {contact.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {contact.phone}</span>}
                            {contact.linkedinProfile && (
                              <a href={contact.linkedinProfile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                                <Linkedin className="h-3 w-3" /> LinkedIn profile
                              </a>
                            )}
                            <span className="text-[10px] font-semibold text-muted-foreground break-all">SignalHire: {contact.signalHireStatus || "pending"}</span>
                          </div>
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
                   Via Kimo
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
  const [runId, setRunId] = useState<number | null>(null);
  const [runSummary, setRunSummary] = useState<LeadRunSummary | null>(null);
  const [liveStatuses, setLiveStatuses] = useState<Record<string, LeadStatusSnapshot>>({});

  useEffect(() => {
    const saved = localStorage.getItem("agency_profile");
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  }, []);

  const triggerDiscover = async () => {
    if (!profile) return;
    setIsSearching(true);
    setRunSummary(null);
    setLiveStatuses({});
    try {
      const response = await generateJobLeads(
        profile.sectors.join(", "),
        profile.name
      );

      setRunId(response.runId || null);
      setRunSummary(response.summary || null);

      toast.info("Kimo: scraping, qualifying, deduping, and queueing SignalHire enrichment...", {
        icon: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
        duration: 2500
      });

      const ranked = rankLeads(profile, response.results || []);
      setLeads(ranked);
      setIsSearching(false);

      if (ranked.length > 0) {
        toast.success(`Kimo identified and ranked ${ranked.length} strategic leads.`);
      } else {
        toast.error("Kimo couldn't find matching leads in the current scan.");
      }
    } catch (error) {
      console.error(error);
      setIsSearching(false);
      toast.error("Failed to connect to Kimo");
    }
  };

  useEffect(() => {
    if (!runId) return;

    const interval = setInterval(async () => {
      try {
        const runStatus = await fetchRunStatus(runId);
        setRunSummary({
          pulled: runStatus.run?.pulled_count || 0,
          qualified: runStatus.run?.qualified_count || 0,
          deduped: runStatus.run?.deduped_count || 0,
          enriched: runStatus.run?.enriched_count || 0,
        });

        const statusMap: Record<string, LeadStatusSnapshot> = {};
        for (const lead of runStatus.leads || []) {
          statusMap[lead.id] = lead;
        }

        for (const lead of leads) {
          try {
            const leadStatus = await fetchLeadStatus(lead.id);
            if (leadStatus?.lead) {
              statusMap[lead.id] = {
                id: lead.id,
                company: lead.company,
                title: lead.title,
                qualification_status: leadStatus.lead.qualification_status,
                dedupe_status: leadStatus.lead.dedupe_status,
                enrichment_status: leadStatus.lead.enrichment_status,
                updated_at: leadStatus.lead.updated_at,
              };
            }
          } catch {
            // keep polling resilient per lead
          }
        }

        setLiveStatuses(statusMap);

        if (runStatus.run?.run_status === "completed") {
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [runId, leads]);

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
            Kimo is mapping live recruitment opportunities for <strong className="text-foreground">{profile.name}</strong>
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-accent rounded-full text-[10px] md:text-xs font-bold border border-emerald-100 shadow-sm w-fit">
            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Kimo Scanning Hiring Signals
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

      {runSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            ["Pulled", runSummary.pulled],
            ["Qualified", runSummary.qualified],
            ["Deduped", runSummary.deduped],
            ["Enriched", runSummary.enriched],
          ].map(([label, value]) => (
            <Card key={String(label)} className="rounded-2xl border-border bg-white shadow-sm">
              <CardContent className="p-4 md:p-5">
                <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
                <div className="mt-2 text-xl md:text-2xl font-bold text-foreground">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        <div className="xl:col-span-2 space-y-6 min-w-0">
          <Card className="border-none shadow-none bg-transparent">
            <Tabs defaultValue="all" className="w-full">
              <div className="mb-6 overflow-x-auto pb-2">
                <TabsList className="inline-flex min-w-max bg-transparent border border-border p-1 rounded-xl h-10">
                  <TabsTrigger value="all" className="rounded-lg px-4 md:px-5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Active Opportunities</TabsTrigger>
                  <TabsTrigger value="all-leads" className="rounded-lg px-4 md:px-5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white">All Leads</TabsTrigger>
                  <TabsTrigger value="specialized" className="rounded-lg px-4 md:px-5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Profile Matched</TabsTrigger>
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
                      <p className="text-muted-foreground font-medium text-sm">No high-match opportunities found yet. Run a new Kimo search.</p>
                    </motion.div>
                  ) : (
                    leads.filter(l => (l.matchScore || 0) > 60).map((lead, index) => (
                      <LeadCard key={lead.id} lead={{ ...lead, liveStatus: liveStatuses[lead.id] }} index={index} />
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
                      <p className="text-muted-foreground font-medium text-sm">No results yet. Start a Kimo discovery scan.</p>
                    </motion.div>
                  ) : (
                    leads.map((lead, index) => (
                      <LeadCard key={lead.id} lead={{ ...lead, liveStatus: liveStatuses[lead.id] }} index={index} />
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
                      <LeadCard key={lead.id} lead={{ ...lead, liveStatus: liveStatuses[lead.id] }} index={index} />
                    ))
                  )}
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <div className="space-y-6 min-w-0">
          <Card className="border-border shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold text-foreground">Kimo Market Pulse</CardTitle>
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
