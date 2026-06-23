import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateEmail } from "@/lib/ai.functions";
import { logActivity } from "@/lib/local-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Copy, RefreshCw, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/email")({
  component: EmailGenerator,
});

type Result = { subject: string; body: string };

function EmailGenerator() {
  const fn = useServerFn(generateEmail);
  const [purpose, setPurpose] = useState("");
  const [audience, setAudience] = useState<"manager" | "client" | "colleague" | "supplier">("manager");
  const [tone, setTone] = useState<"formal" | "friendly" | "persuasive" | "follow-up">("formal");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const run = async () => {
    if (purpose.trim().length < 3) return toast.error("Please describe the email purpose.");
    setLoading(true);
    try {
      const r = await fn({ data: { purpose, audience, tone } });
      setResult(r);
      logActivity("email", r.subject || "Email generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in duration-500">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-elegant">
          <Mail className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Smart Email Generator</h1>
          <p className="text-sm text-muted-foreground">Generate professional workplace emails by purpose, audience, and tone.</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-2 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="purpose">Email purpose</Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="e.g. Ask the client to reschedule Friday's review meeting to next Tuesday"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="colleague">Colleague</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="persuasive">Persuasive</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={run} disabled={loading} className="w-full bg-gradient-primary shadow-elegant">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {result ? "Regenerate" : "Generate email"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Review and personalize the AI's draft before sending.
          </p>
        </Card>

        <Card className="p-6 lg:col-span-3 min-h-[420px]">
          {!result && !loading && (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center text-muted-foreground">
              <Mail className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Your generated email will appear here.</p>
            </div>
          )}

          {loading && (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Drafting your email…</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Subject</Label>
                <div className="flex gap-2">
                  <Input value={result.subject} onChange={(e) => setResult({ ...result, subject: e.target.value })} />
                  <Button variant="outline" size="icon" onClick={() => copy(result.subject, "Subject")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Body</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => copy(result.body, "Body")}>
                      <Copy className="h-3 w-3 mr-2" /> Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={run} disabled={loading}>
                      <RefreshCw className="h-3 w-3 mr-2" /> Regenerate
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={result.body}
                  onChange={(e) => setResult({ ...result, body: e.target.value })}
                  rows={14}
                  className="font-mono text-sm whitespace-pre-wrap"
                />
              </div>
              <Button
                variant="secondary"
                onClick={() => copy(`Subject: ${result.subject}\n\n${result.body}`, "Full email")}
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" /> Copy full email
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
