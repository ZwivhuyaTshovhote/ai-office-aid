import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { researchTopic } from "@/lib/ai.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Search, Copy, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/research")({
  component: Research,
});

type Result = {
  summary: string;
  key_points: string[];
  insights: string[];
  recommendations: string[];
};

function Research() {
  const fn = useServerFn(researchTopic);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const run = async () => {
    if (topic.trim().length < 3) return toast.error("Enter a topic or paste text.");
    setLoading(true);
    try {
      const r = await fn({ data: { topic } });
      setResult(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to research");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!result) return;
    const text = [
      `# Research Summary\n`,
      `## Summary\n${result.summary}\n`,
      `## Key Points\n${result.key_points.map((p) => `- ${p}`).join("\n")}\n`,
      `## Insights\n${result.insights.map((p) => `- ${p}`).join("\n")}\n`,
      `## Recommendations\n${result.recommendations.map((p) => `- ${p}`).join("\n")}\n`,
    ].join("\n");
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "research-summary.md"; a.click();
    URL.revokeObjectURL(url);
  };

  const Section = ({ title, items, accent }: { title: string; items: string[]; accent: string }) => (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`h-2 w-2 rounded-full ${accent}`} />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <ul className="space-y-2 text-sm">
        {items.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-primary">•</span>
            <span className="text-foreground/90">{p}</span>
          </li>
        ))}
      </ul>
    </Card>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in duration-500">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-elegant">
          <Search className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Research Assistant</h1>
          <p className="text-sm text-muted-foreground">Summaries, key points, insights and recommendations.</p>
        </div>
      </header>

      <Card className="p-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="topic">Topic or text</Label>
          <Textarea
            id="topic"
            rows={6}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={8000}
            placeholder="Enter a research topic, paste an article, meeting notes, or a long document…"
          />
          <p className="text-xs text-muted-foreground text-right">{topic.length}/8000</p>
        </div>
        <Button onClick={run} disabled={loading} className="bg-gradient-primary shadow-elegant">
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Analyze
        </Button>
      </Card>

      {loading && (
        <Card className="p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Reading and synthesizing…</p>
        </Card>
      )}

      {result && !loading && (
        <div className="space-y-4">
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Summary</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(result.summary); toast.success("Copied"); }}>
                  <Copy className="h-3 w-3 mr-2" /> Copy
                </Button>
                <Button variant="outline" size="sm" onClick={download}>
                  <Download className="h-3 w-3 mr-2" /> Download
                </Button>
              </div>
            </div>
            <p className="text-sm leading-relaxed">{result.summary}</p>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Section title="Key Points" items={result.key_points} accent="bg-primary" />
            <Section title="Insights" items={result.insights} accent="bg-accent" />
            <Section title="Recommendations" items={result.recommendations} accent="bg-primary-glow" />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            AI may produce inaccuracies — verify important facts before acting on them.
          </p>
        </div>
      )}
    </div>
  );
}
