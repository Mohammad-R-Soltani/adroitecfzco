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
      const devices =
        c.devices.map((d) => d.name).join(", ") ||
        "none listed";

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
        c.geekbenchMultiCore
          ? `  Geekbench 6 multi-core (approx): ${c.geekbenchMultiCore}`
          : null,
        `  Devices: ${devices}`,
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
- Geekbench numbers in the catalog are approximate and only meant for relative comparison — say that whenever you cite them.
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

  try {
    const res = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
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

          max_tokens: 800,
        }),
      }
    );

    // ============================================================
    // Handle API error
    // ============================================================

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

    // ============================================================
    // Parse response
    // ============================================================

    const data = await res.json();

    const reply =
      data?.choices?.[0]?.message?.content
        ?.toString()
        .trim();

    if (!reply) {
      console.error(
        "OpenRouter returned no assistant message:",
        JSON.stringify(data).slice(0, 2000)
      );

      return NextResponse.json(
        {
          error:
            "The assistant didn't return an answer.",
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