import type { Context } from "@netlify/functions"

export default async (req: Request, _context: Context) => {
  // CORS headers
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

  // Support OAuth token (from Claude Code credentials) or API key
  const oauthToken = process.env.ANTHROPIC_OAUTH_TOKEN
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!oauthToken && !apiKey) {
    return new Response(
      JSON.stringify({ error: "No Anthropic credentials configured" }),
      { status: 500, headers }
    )
  }

  try {
    const { photoUrl, stepName, vehicleInfo } = await req.json()

    if (!photoUrl) {
      return new Response(
        JSON.stringify({ error: "photoUrl is required" }),
        { status: 400, headers }
      )
    }

    // Fetch the image and convert to base64
    const imageResponse = await fetch(photoUrl)
    if (!imageResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch image" }),
        { status: 400, headers }
      )
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString("base64")

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg"
    const mediaType = contentType.startsWith("image/") ? contentType : "image/jpeg"

    // Build the analysis prompt
    const vehicleDesc = vehicleInfo
      ? `${vehicleInfo.year || ""} ${vehicleInfo.make || ""} ${vehicleInfo.model || ""} ${vehicleInfo.trim || ""}`.trim()
      : "a vehicle"

    const prompt = `You are a professional vehicle inspector analyzing a photo of ${vehicleDesc}.
This photo is from the "${stepName || "inspection"}" step of a pre-purchase vehicle inspection.

Analyze this image and provide:
1. A brief description of what you see (2-3 sentences)
2. Any issues, damage, wear, or concerns you notice
3. An overall verdict: "ok" (no issues), "warning" (minor concerns), or "issue" (significant problems found)

Respond in this exact JSON format:
{
  "analysis": "your analysis text here",
  "verdict": "ok" | "warning" | "issue"
}`

    // Call Claude Vision API (same OAuth approach as copart-video skill)
    const authHeaders: Record<string, string> = oauthToken
      ? {
          "Authorization": `Bearer ${oauthToken}`,
          "anthropic-beta": "oauth-2025-04-20",
        }
      : {
          "x-api-key": apiKey!,
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
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Image,
                },
              },
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
    const responseText =
      claudeData.content?.[0]?.text || ""

    // Parse the JSON response from Claude
    let analysis = responseText
    let verdict = "ok"

    try {
      // Extract JSON from the response (Claude may wrap it in markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        analysis = parsed.analysis || responseText
        verdict = ["ok", "warning", "issue"].includes(parsed.verdict)
          ? parsed.verdict
          : "ok"
      }
    } catch {
      // If JSON parsing fails, use the raw text as analysis
      analysis = responseText
    }

    return new Response(
      JSON.stringify({ analysis, verdict }),
      { status: 200, headers }
    )
  } catch (err) {
    console.error("analyze-photo error:", err)
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        detail: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers }
    )
  }
}
