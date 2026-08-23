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

const MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";

export async function POST(req: NextRequest) {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json(
      { error: "Sign in to use the assistant." },
      { status: 401 }
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "The assistant isn't configured yet — add OPENROUTER_API_KEY to .env and restart the server.",
      },
      { status: 503 }
    );
  }

  const parsed = BodySchema.safeParse(
    await req.json().catch(() => null)
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }

  // ============================================================
  // Load catalog
  // ============================================================

  const chipsets = await prisma.chipset.findMany({
    include: {
      brand: {
        select: {
          name: true,
        },
      },
      devices: {
        select: {
          name: true,
          benchmarks: {
            select: { family: true, metric: true, value: true, sourceName: true },
          },
        },
      },
    },
    orderBy: [
      {
        releaseYear: "desc",
      },
    ],
  });

  const catalog = chipsets
    .map((c) => {
      const deviceNames =
        c.devices.map((d) => d.name).join(", ") ||
        "none listed";

      const benchLines = c.devices
        .flatMap((d) =>
          d.benchmarks.map(
            (b) => `  Benchmark: ${d.name} — ${b.family} ${b.metric} = ${b.value} (source: ${b.sourceName}, verified)`
          )
        )
        .join("\n");

      return [
        `${c.brand.name} ${c.name} (${c.series}, ${c.releaseYear})`,
        `  Process: ${c.processNode}`,
        `  CPU: ${c.cpuSummary}`,
        `  GPU: ${c.gpuSummary}`,
        c.npuSummary
          ? `  NPU: ${c.npuSummary}`
          : null,
        c.maxRam
          ? `  Memory: ${c.maxRam}`
          : null,
        `  Devices: ${deviceNames}`,
        benchLines || "  Benchmark: no verified results on file yet for these devices",
        `  Note: ${c.highlight}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  // ============================================================
  // System prompt
  // ============================================================

  const systemPrompt = `You are the in-app assistant for adroitecfzco, a Dubai-based wholesale trading company that distributes Apple and Xiaomi devices to buyers across many regions.

You help the company's staff — sourcing, sales and account teams — stay sharp on product detail so they can quote, negotiate and brief buyers accurately.

Rules:
- Answer in English, in a direct, professional way.
- Keep answers concise: two or three short paragraphs at most unless the user explicitly asks for more detail.
- Base every factual claim about chipsets and devices on the catalog below.
- If something isn't in the catalog, say so plainly rather than guessing.
- Benchmark figures in the catalog are real, sourced lab results tied to a specific device and benchmark version (e.g. "Geekbench 6" vs "Geekbench 5", "AnTuTu v10" vs "v11") — never mix different versions in one comparison, and name the source when you cite a number. If a chipset has no "Benchmark:" line for any of its devices, say plainly that it hasn't been verified yet rather than guessing.
- When comparing chipsets, lead with what matters to a trade buyer: which tier the part sits in, how it positions the device against its rivals, and the selling points a buyer's own customers will ask about.
- Never invent prices, margins, MOQs, stock levels, regional variants, or release dates.
- If information is missing from the catalog, tell the user that the team should confirm it internally.

CATALOG:

${catalog}`;

  // ============================================================
  // OpenRouter messages
  // ============================================================

  const messages = [
    {
      role: "system" as const,
      content: systemPrompt,
    },
    ...parsed.data.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  // ============================================================
  // Call OpenRouter
  // ============================================================

  // `openrouter/free` routes to whichever free model is available, and several
  // of those are reasoning models that spend their token budget thinking and
  // return an empty `content`. A low reasoning effort plus generous headroom
  // keeps that from happening; one retry covers the rest.
  async function askOpenRouter() {
    return fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,

        // Optional but recommended by OpenRouter
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL ||
          "https://adroitecfzco.com",

        "X-Title": "Adroit Device Catalog",
      },

      body: JSON.stringify({
        model: MODEL,
        messages,

        temperature: 0.4,

        max_tokens: 1400,

        reasoning: { effort: "low" },
      }),
    });
  }

  try {
    let reply: string | undefined;

    for (let attempt = 0; attempt < 2 && !reply; attempt++) {
      const res = await askOpenRouter();

      if (!res.ok) {
        const detail = await res.text();

        console.error(
          "OpenRouter error:",
          res.status,
          detail.slice(0, 1000)
        );

        return NextResponse.json(
          {
            error:
              "The assistant is unavailable right now. Try again in a moment.",
          },
          {
            status: 502,
          }
        );
      }

      const data = await res.json();

      reply =
        data?.choices?.[0]?.message?.content
          ?.toString()
          .trim() || undefined;

      if (!reply) {
        console.error(
          `OpenRouter returned no assistant message (attempt ${attempt + 1}):`,
          JSON.stringify(data).slice(0, 1000)
        );
      }
    }

    if (!reply) {
      return NextResponse.json(
        {
          error:
            "The assistant didn't return an answer. Try asking again.",
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json({
      reply,
    });
  } catch (error) {
    console.error(
      "OpenRouter request failed:",
      error
    );

    return NextResponse.json(
      {
        error: "Couldn't reach the assistant.",
      },
      {
        status: 502,
      }
    );
  }
}