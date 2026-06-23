import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Mail, CalendarCheck, Search, Sparkles, ArrowUpRight, FileText } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

type Stats = { emails: number; tasksDone: number; research: number };
type Activity = { id: string; kind: string; title: string; created_at: string };

type Task = { id: string; title: string; status: "pending" | "completed" };

function Dashboard() {
  const [stats, setStats] = useState<Stats>({ emails: 0, tasksDone: 0, research: 0 });
  const [recent, setRecent] = useState<Activity[]>([]);

  useEffect(() => {
    try {
      const activity: Activity[] = JSON.parse(localStorage.getItem("ws_activity") || "[]");
      const tasks: Task[] = JSON.parse(localStorage.getItem("ws_tasks") || "[]");
      setStats({
        emails: activity.filter((a) => a.kind === "email").length,
        research: activity.filter((a) => a.kind === "research").length,
        tasksDone: tasks.filter((t) => t.status === "completed").length,
      });
      setRecent(activity.slice(0, 6));
    } catch {
      /* ignore */
    }
  }, []);

  const cards = [
    { label: "Emails Generated", value: stats.emails, icon: Mail, accent: "from-primary to-primary-glow" },
    { label: "Tasks Completed", value: stats.tasksDone, icon: CalendarCheck, accent: "from-accent to-primary" },
    { label: "Research Summaries", value: stats.research, icon: Search, accent: "from-primary-glow to-accent" },
  ];

  const quick = [
    { to: "/email", label: "Write an email", icon: Mail, desc: "Draft a professional email in seconds." },
    { to: "/planner", label: "Plan my day", icon: CalendarCheck, desc: "Optimize your schedule with AI." },
    { to: "/research", label: "Research a topic", icon: Search, desc: "Summaries, insights and recommendations." },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <section className="rounded-2xl bg-gradient-hero p-8 text-white shadow-elegant relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-12 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
            <Sparkles className="h-3 w-3" /> WorkSmart AI Assistant
          </span>
          <h1 className="text-3xl md:text-4xl font-bold">Welcome to WorkSmart.</h1>
          <p className="text-white/70 max-w-xl">Automate the repetitive parts of your day. Generate emails, plan tasks, and summarize information — responsibly.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-5 shadow-card hover:shadow-elegant transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${c.accent} text-white`}>
                <c.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold">{c.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">Saved locally in your browser</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {quick.map((q) => (
          <Link key={q.to} to={q.to}>
            <Card className="group p-5 h-full hover:shadow-elegant transition-all hover:-translate-y-0.5">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <q.icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="mt-4 font-semibold">{q.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{q.desc}</p>
            </Card>
          </Link>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent activity</h2>
        </div>
        <Card className="divide-y divide-border">
          {recent.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No activity yet. Try the <Link to="/email" className="text-primary underline-offset-4 hover:underline">Email Generator</Link> to get started.
            </div>
          )}
          {recent.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground">
                {a.kind === "email" ? <Mail className="h-4 w-4" /> : a.kind === "research" ? <Search className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{a.kind} · {new Date(a.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </Card>
      </section>

      <p className="text-xs text-muted-foreground text-center">
        AI-generated content should be reviewed and verified before professional use.
      </p>
    </div>
  );
}
