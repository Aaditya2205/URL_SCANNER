import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Mock blocklist for demonstration
const MOCK_BLOCKLIST = ["malware-example.com", "phishing-site.com", "suspicious-domain.net"]

// URL validation schema
const urlSchema = z.object({
  url: z.string().url(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = urlSchema.parse(body)

    // Parse URL to get domain
    const urlObj = new URL(url)
    const domain = urlObj.hostname

    // Check if domain is in blocklist
    const blocklisted = MOCK_BLOCKLIST.some((item) => domain === item || domain.endsWith(`.${item}`))

    // Determine if URL uses HTTPS
    const https = urlObj.protocol === "https:"

    // Generate warnings
    const warnings = []

    if (!https) {
      warnings.push("This site does not use HTTPS, which means data is not encrypted during transmission.")
    }

    if (blocklisted) {
      warnings.push("This domain appears on a known blocklist and may be unsafe.")
    }

    // Make a real HTTP request to check status (with timeout)
    let statusCode = 0
    let ipAddress = null

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
      })

      clearTimeout(timeoutId)
      statusCode = response.status

      // For demo purposes, generate a fake IP
      ipAddress = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`

      if (statusCode >= 400) {
        warnings.push(`Server returned error status code: ${statusCode}`)
      }
    } catch (error: any) {
      warnings.push(`Connection error: ${error.message || "Could not connect to server"}`)
      statusCode = 0
    }

    // Calculate risk score (0-10)
    let riskScore = 0

    if (blocklisted) riskScore += 5
    if (!https) riskScore += 3
    if (statusCode >= 400 || statusCode === 0) riskScore += 2

    // Determine if URL is safe
    const safe = riskScore < 5

    return NextResponse.json({
      url,
      domain,
      ipAddress,
      statusCode,
      https,
      safe,
      blocklisted,
      riskScore,
      warnings,
      timestamp: Date.now(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    console.error("Scan error:", error)
    return NextResponse.json({ error: "Failed to scan URL" }, { status: 500 })
  }
}

