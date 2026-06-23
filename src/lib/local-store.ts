export type Activity = {
  id: string;
  kind: "email" | "research" | "task";
  title: string;
  created_at: string;
};

const KEY = "ws_activity";

export function logActivity(kind: Activity["kind"], title: string) {
  if (typeof window === "undefined") return;
  try {
    const list: Activity[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    list.unshift({
      id: crypto.randomUUID(),
      kind,
      title: title.slice(0, 120),
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    /* ignore */
  }
}
