import type { Context } from "@netlify/functions"

export default async (req: Request, _context: Context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    })
  }

  const oauthToken = process.env.ANTHROPIC_OAUTH_TOKEN
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!oauthToken && !apiKey) {
    return new Response(
      JSON.stringify({ error: "No Anthropic credentials configured" }),
      { status: 500, headers }
    )
  }

  try {
    const { fileUrl, reportType, fileType, vehicleInfo } = await req.json()

    if (!fileUrl || !reportType) {
      return new Response(
        JSON.stringify({ error: "fileUrl and reportType are required" }),
        { status: 400, headers }
      )
    }

    // Fetch the file and convert to base64
    const fileResponse = await fetch(fileUrl)
    if (!fileResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch file" }),
        { status: 400, headers }
      )
    }

    const fileBuffer = await fileResponse.arrayBuffer()
    const base64Data = Buffer.from(fileBuffer).toString("base64")

    const vehicleDesc = vehicleInfo
      ? `${vehicleInfo.year || ""} ${vehicleInfo.make || ""} ${vehicleInfo.model || ""} ${vehicleInfo.trim || ""}`.trim()
      : "a vehicle"

    // Build report-type-specific prompts
    const reportPrompts: Record<string, string> = {
      obd2: `You are analyzing an OBD II diagnostic report for ${vehicleDesc}.

Extract and summarize the following key findings:
- Diagnostic Trouble Codes (DTCs) - active and pending
- Readiness monitor status
- Freeze frame data if present
- Overall vehicle health assessment

Provide a concise summary (3-5 paragraphs) of the findings. Focus on anything a car buyer should know. If codes are present, explain what they mean in plain language.`,

      carfax: `You are analyzing a CarFax vehicle history report for ${vehicleDesc}.

Extract and summarize the following key findings:
- Number of previous owners
- Accident/damage history
- Service and maintenance records
- Title status (clean, salvage, rebuilt, etc.)
- Odometer readings and any discrepancies
- Open recalls
- Any red flags

Provide a concise summary (3-5 paragraphs) of the findings. Focus on anything a car buyer should know.`,

      autocheck: `You are analyzing an AutoCheck vehicle history report for ${vehicleDesc}.

Extract and summarize the following key findings:
- AutoCheck score and what it means
- Damage/accident records
- Title history and brand checks
- Odometer analysis
- Number of owners
- Any red flags or alerts

Provide a concise summary (3-5 paragraphs) of the findings. Focus on anything a car buyer should know.`,
    }

    const prompt = reportPrompts[reportType] || reportPrompts.obd2

    // Determine content type for Claude API
    const isPdf = (fileType || "").includes("pdf")
    const contentBlock = isPdf
      ? {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf" as const,
            data: base64Data,
          },
        }
      : {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: (fileType || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: base64Data,
          },
        }

    const authHeaders: Record<string, string> = oauthToken
      ? {
          "Authorization": `Bearer ${oauthToken}`,
          "anthropic-beta": "oauth-2025-04-20,pdfs-2024-09-25",
        }
      : {
          "x-api-key": apiKey!,
          "anthropic-beta": "pdfs-2024-09-25",
        }

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              contentBlock,
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    })

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text()
      console.error("Claude API error:", errText)
      return new Response(
        JSON.stringify({ error: "AI analysis failed", detail: errText }),
        { status: 502, headers }
      )
    }

    const claudeData = await claudeResponse.json()
    const summary = claudeData.content?.[0]?.text || "Unable to analyze document."

    return new Response(
      JSON.stringify({ summary }),
      { status: 200, headers }
    )
  } catch (err) {
    console.error("analyze-report error:", err)
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        detail: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers }
    )
  }
}
