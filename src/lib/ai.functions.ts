import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const EmailInput = z.object({
  purpose: z.string().min(3).max(2000),
  audience: z.enum(["manager", "client", "colleague", "supplier"]),
  tone: z.enum(["formal", "friendly", "persuasive", "follow-up"]),
});

const ResearchInput = z.object({
  topic: z.string().min(3).max(8000),
});

const PlanInput = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      deadline: z.string().nullable().optional(),
      priority: z.enum(["low", "medium", "high"]),
      status: z.enum(["pending", "completed"]).optional(),
    }),
  ).max(100),
});

async function callGateway(messages: Array<{ role: string; content: string }>, opts?: { json?: boolean }) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
      ...(opts?.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in workspace billing.");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI error: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content as string;
}

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => EmailInput.parse(d))
  .handler(async ({ data }) => {
    const system =
      "You are a professional business communication assistant. Create a clear, professional email based on the user's purpose, audience, and selected tone. Respond ONLY with strict JSON: {\"subject\": string, \"body\": string}. The body should use real line breaks (\\n). Keep it concise and professional. Do not include markdown fences.";
    const user = `Purpose: ${data.purpose}\nAudience: ${data.audience}\nTone: ${data.tone}`;
    const content = await callGateway(
      [{ role: "system", content: system }, { role: "user", content: user }],
      { json: true },
    );
    let parsed: { subject: string; body: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { subject: "Email", body: content };
    }
    return parsed;
  });

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PlanInput.parse(d))
  .handler(async ({ data }) => {
    const system =
      "You are a productivity coach. Organize tasks into an efficient schedule using priorities, deadlines, and time management strategies. Respond in clear markdown with sections: Today, This Week, Recommendations. Be concise and actionable.";
    const user = `Here are my tasks (JSON):\n${JSON.stringify(data.tasks, null, 2)}\n\nProduce an optimized schedule.`;
    const content = await callGateway([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
    return { plan: content };
  });

export const researchTopic = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ResearchInput.parse(d))
  .handler(async ({ data }) => {
    const system =
      "You are a research analyst. Summarize information clearly, extract key insights, and provide useful recommendations. Respond ONLY with strict JSON: {\"summary\": string, \"key_points\": string[], \"insights\": string[], \"recommendations\": string[]}. No markdown fences.";
    const user = `Topic or text to analyze:\n${data.topic}`;
    const content = await callGateway(
      [{ role: "system", content: system }, { role: "user", content: user }],
      { json: true },
    );
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { summary: content, key_points: [], insights: [], recommendations: [] };
    }
    return parsed as { summary: string; key_points: string[]; insights: string[]; recommendations: string[] };
  });
