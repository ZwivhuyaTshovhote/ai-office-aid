import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Eye, AlertTriangle, UserCheck, Lock, Scale } from "lucide-react";

export const Route = createFileRoute("/_authenticated/guidelines")({
  component: Guidelines,
});

function Guidelines() {
  const principles = [
    { icon: Eye, title: "Always review", body: "AI-generated content should be reviewed and verified before professional use. AI may occasionally produce inaccurate information, therefore human judgement is required." },
    { icon: AlertTriangle, title: "Limitations", body: "AI does not know your private context, may invent facts (hallucinations), and reflects biases present in training data. Treat outputs as drafts, not as authoritative answers." },
    { icon: UserCheck, title: "Personalize", body: "Replace generic phrasing with details specific to the recipient or topic. Confirm names, dates, numbers and commitments before sending." },
    { icon: Lock, title: "Privacy", body: "Avoid pasting confidential client data, credentials, or personally identifiable information unless your organisation has approved AI use for that data." },
    { icon: Scale, title: "Compliance", body: "Follow your workplace's policies on AI usage, intellectual property and disclosure. When in doubt, ask a manager or compliance lead." },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in duration-500">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-elegant">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Responsible AI Guidelines</h1>
          <p className="text-sm text-muted-foreground">Use AI thoughtfully and responsibly in the workplace.</p>
        </div>
      </header>

      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <p className="text-base leading-relaxed">
          <strong>AI-generated content should be reviewed and verified before professional use.</strong> AI may
          occasionally produce inaccurate information, therefore human judgement is required.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {principles.map((p) => (
          <Card key={p.title} className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <p.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{p.body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-3">A simple checklist before you send</h2>
        <ul className="space-y-2 text-sm">
          <li>✓ Have you read the entire output, not just the first paragraph?</li>
          <li>✓ Are names, dates, numbers, and links correct?</li>
          <li>✓ Does the tone match the recipient and the situation?</li>
          <li>✓ Have you removed any sensitive or confidential information that shouldn't be shared?</li>
          <li>✓ Would you be comfortable putting your name on this work?</li>
        </ul>
      </Card>
    </div>
  );
}
