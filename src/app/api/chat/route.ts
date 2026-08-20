import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const BodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(20),
});

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to use the assistant." }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "The assistant isn't configured yet — add GEMINI_API_KEY to .env and restart the server." },
      { status: 503 }
    );
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const chipsets = await prisma.chipset.findMany({
    include: {
      brand: { select: { name: true } },
      devices: { select: { name: true } },
    },
    orderBy: [{ releaseYear: "desc" }],
  });

  const catalog = chipsets
    .map((c) => {
      const devices = c.devices.map((d) => d.name).join(", ") || "none listed";
      return [
        `${c.brand.name} ${c.name} (${c.series}, ${c.releaseYear})`,
        `  Process: ${c.processNode}`,
        `  CPU: ${c.cpuSummary}`,
        `  GPU: ${c.gpuSummary}`,
        c.npuSummary ? `  NPU: ${c.npuSummary}` : null,
        c.maxRam ? `  Memory: ${c.maxRam}` : null,
        c.geekbenchMultiCore ? `  Geekbench 6 multi-core (approx): ${c.geekbenchMultiCore}` : null,
        `  Devices: ${devices}`,
        `  Note: ${c.highlight}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  const systemPrompt = `You are the in-app assistant for adroitecfzco, a Dubai-based wholesale trading company that distributes Apple and Xiaomi devices to buyers across many regions. You help the company's staff — sourcing, sales and account teams — stay sharp on product detail so they can quote, negotiate and brief buyers accurately.

Rules:
- Answer in English, in a direct, professional way. Two or three short paragraphs at most.
- Base every factual claim about chipsets and devices on the catalog below. If something isn't in the catalog, say so plainly rather than guessing.
- Geekbench numbers in the catalog are approximate and only meant for relative comparison — say that whenever you cite them.
- When comparing chipsets, lead with what matters to a trade buyer: which tier the part sits in, how it positions the device against its rivals, and the selling points a buyer's own customers will ask about.
- Never invent prices, margins, MOQs, stock levels, regional variants, or release dates. Those aren't in the catalog — say the team should confirm them internally.

CATALOG:
${catalog}`;

  const contents = parsed.data.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
        }),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error("Gemini error", res.status, detail.slice(0, 400));
      return NextResponse.json(
        { error: "The assistant is unavailable right now. Try again in a moment." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const reply: string | undefined = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim();

    if (!reply) {
      return NextResponse.json({ error: "The assistant didn't return an answer." }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Gemini request failed", error);
    return NextResponse.json({ error: "Couldn't reach the assistant." }, { status: 502 });
  }
}
