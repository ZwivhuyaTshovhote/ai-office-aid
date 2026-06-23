import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { planTasks } from "@/lib/ai.functions";
import { logActivity } from "@/lib/local-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarCheck, Plus, Loader2, Sparkles, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/planner")({
  component: Planner,
});

type Task = {
  id: string;
  title: string;
  deadline: string | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "completed";
};

const priorityColor: Record<Task["priority"], string> = {
  high: "bg-destructive/15 text-destructive border-destructive/30",
  medium: "bg-warning/15 text-warning-foreground border-warning/30",
  low: "bg-success/15 text-success-foreground border-success/30",
};

const STORAGE_KEY = "ws_tasks";

function loadTasks(): Task[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function Planner() {
  const fn = useServerFn(planTasks);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [aiPlan, setAiPlan] = useState<string>("");
  const [planning, setPlanning] = useState(false);
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");

  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  const persist = (next: Task[]) => {
    setTasks(next);
    saveTasks(next);
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const t: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      deadline: deadline ? new Date(deadline).toISOString() : null,
      priority,
      status: "pending",
    };
    persist([...tasks, t].sort((a, b) => (a.deadline || "").localeCompare(b.deadline || "")));
    setTitle(""); setDeadline(""); setPriority("medium");
    toast.success("Task added");
  };

  const toggleDone = (t: Task) => {
    const next = t.status === "completed" ? "pending" : "completed";
    persist(tasks.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
    if (next === "completed") logActivity("task", t.title);
  };

  const removeTask = (id: string) => {
    persist(tasks.filter((t) => t.id !== id));
  };

  const runPlan = async () => {
    if (tasks.length === 0) return toast.error("Add some tasks first.");
    setPlanning(true);
    try {
      const r = await fn({
        data: {
          tasks: tasks.map((t) => ({
            title: t.title,
            deadline: t.deadline,
            priority: t.priority,
            status: t.status,
          })),
        },
      });
      setAiPlan(r.plan);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to plan");
    } finally {
      setPlanning(false);
    }
  };

  const grid = useMemo(() => {
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startDay = start.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const tasksByDay = useMemo(() => {
    const m: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (!t.deadline) continue;
      const key = new Date(t.deadline).toDateString();
      (m[key] ||= []).push(t);
    }
    return m;
  }, [tasks]);

  const today = new Date();
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  const weekDays = useMemo(() => {
    const start = new Date(cursor);
    start.setDate(cursor.getDate() - cursor.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const upcoming = tasks
    .filter((t) => t.deadline && t.status === "pending")
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-elegant">
          <CalendarCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Task Planner</h1>
          <p className="text-sm text-muted-foreground">Organize your day and let AI optimize your schedule.</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 space-y-4 lg:col-span-1">
          <h2 className="font-semibold">Add task</h2>
          <form onSubmit={addTask} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Prepare Q3 report" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full"><Plus className="h-4 w-4 mr-2" /> Add</Button>
          </form>

          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold mb-2">Upcoming deadlines</h3>
            {upcoming.length === 0 && <p className="text-xs text-muted-foreground">No upcoming tasks.</p>}
            <div className="space-y-2">
              {upcoming.map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className={priorityColor[t.priority]}>{t.priority}</Badge>
                  <span className="truncate flex-1">{t.title}</span>
                  <span className="text-muted-foreground">{new Date(t.deadline!).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => {
                  const d = new Date(cursor);
                  if (view === "month") d.setMonth(d.getMonth() - 1);
                  else if (view === "week") d.setDate(d.getDate() - 7);
                  else d.setDate(d.getDate() - 1);
                  setCursor(d);
                }}><ChevronLeft className="h-4 w-4" /></Button>
                <h2 className="font-semibold min-w-[180px] text-center">
                  {view === "day"
                    ? cursor.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
                    : cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </h2>
                <Button variant="outline" size="icon" onClick={() => {
                  const d = new Date(cursor);
                  if (view === "month") d.setMonth(d.getMonth() + 1);
                  else if (view === "week") d.setDate(d.getDate() + 7);
                  else d.setDate(d.getDate() + 1);
                  setCursor(d);
                }}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
              </div>
              <TabsList>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="day">Day</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="month" className="mt-0">
              <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground mb-1">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                  <div key={d} className="px-2 py-1 font-medium">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {grid.map((d, i) => {
                  if (!d) return <div key={i} className="min-h-[80px] rounded-md bg-muted/30" />;
                  const dayTasks = tasksByDay[d.toDateString()] ?? [];
                  const isToday = isSameDay(d, today);
                  return (
                    <div key={i} className={`min-h-[80px] rounded-md border p-1.5 text-xs ${isToday ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className={`mb-1 font-medium ${isToday ? "text-primary" : ""}`}>{d.getDate()}</div>
                      <div className="space-y-0.5">
                        {dayTasks.slice(0, 3).map((t) => (
                          <div key={t.id} className={`truncate rounded px-1 py-0.5 border ${priorityColor[t.priority]} ${t.status === "completed" ? "opacity-50 line-through" : ""}`}>
                            {t.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && <div className="text-muted-foreground">+{dayTasks.length - 3}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="week" className="mt-0">
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((d) => {
                  const dayTasks = tasksByDay[d.toDateString()] ?? [];
                  const isToday = isSameDay(d, today);
                  return (
                    <div key={d.toISOString()} className={`min-h-[160px] rounded-md border p-2 ${isToday ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="text-xs text-muted-foreground">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
                      <div className={`text-lg font-semibold mb-2 ${isToday ? "text-primary" : ""}`}>{d.getDate()}</div>
                      <div className="space-y-1">
                        {dayTasks.map((t) => (
                          <div key={t.id} className={`text-xs rounded px-1.5 py-1 border ${priorityColor[t.priority]} ${t.status === "completed" ? "opacity-50 line-through" : ""}`}>
                            {t.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="day" className="mt-0">
              <div className="space-y-2">
                {(tasksByDay[cursor.toDateString()] ?? []).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-md border border-border">
                    <Checkbox checked={t.status === "completed"} onCheckedChange={() => toggleDone(t)} />
                    <span className={`flex-1 ${t.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                    <Badge variant="outline" className={priorityColor[t.priority]}>{t.priority}</Badge>
                  </div>
                ))}
                {(tasksByDay[cursor.toDateString()] ?? []).length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-12">No tasks for this day.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="font-semibold">All tasks</h2>
          <Button onClick={runPlan} disabled={planning} className="bg-gradient-primary shadow-elegant">
            {planning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate AI schedule
          </Button>
        </div>
        <div className="space-y-2">
          {tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-md border border-border hover:bg-secondary/40 transition-colors">
              <Checkbox checked={t.status === "completed"} onCheckedChange={() => toggleDone(t)} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${t.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                {t.deadline && <p className="text-xs text-muted-foreground">Due {new Date(t.deadline).toLocaleString()}</p>}
              </div>
              <Badge variant="outline" className={priorityColor[t.priority]}>{t.priority}</Badge>
              <Button variant="ghost" size="icon" onClick={() => removeTask(t.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {aiPlan && (
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">AI Schedule</h2>
          </div>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{aiPlan}</pre>
        </Card>
      )}
    </div>
  );
}
