"use server"

import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import { cookies } from "next/headers"

// Mock blocklist for demonstration
const MOCK_BLOCKLIST = ["malware-example.com", "phishing-site.com", "suspicious-domain.net"]

// URL validation schema
const urlSchema = z
  .string()
  .url()
  .refine(
    (url) => {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    },
    { message: "Invalid URL format" },
  )

type ScanResult = {
  id: string
  url: string
  domain: string
  ipAddress: string | null
  statusCode: number
  https: boolean
  safe: boolean
  blocklisted: boolean
  riskScore: number
  warnings: string[]
  timestamp: number
}

export async function scanUrl(url: string): Promise<ScanResult> {
  try {
    // Validate URL
    const validatedUrl = urlSchema.parse(url)

    // Parse URL to get domain
    const urlObj = new URL(validatedUrl)
    const domain = urlObj.hostname

    // Check if domain is in blocklist
    const blocklisted = MOCK_BLOCKLIST.some((item) => domain === item || domain.endsWith(`.${item}`))

    // Determine if URL uses HTTPS
    const https = urlObj.protocol === "https:"

    // Generate warnings
    const warnings: string[] = []

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

      const response = await fetch(validatedUrl, {
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

    // Create scan result
    const result: ScanResult = {
      id: uuidv4(),
      url: validatedUrl,
      domain,
      ipAddress,
      statusCode,
      https,
      safe,
      blocklisted,
      riskScore,
      warnings,
      timestamp: Date.now(),
    }

    // Save to history
    await saveScanToHistory(result)

    return result
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error("Invalid URL format. Please enter a valid URL including http:// or https://")
    }
    throw error
  }
}

// Save scan to history in cookies
async function saveScanToHistory(scan: ScanResult) {
  const cookieStore = cookies()
  const existingHistory = cookieStore.get("scan-history")

  let history = []

  if (existingHistory) {
    try {
      history = JSON.parse(existingHistory.value)
    } catch {
      history = []
    }
  }

  // Add new scan to history (simplified version for cookie storage)
  history.unshift({
    id: scan.id,
    url: scan.url,
    timestamp: scan.timestamp,
    safe: scan.safe,
    riskScore: scan.riskScore,
  })

  // Keep only the last 10 scans
  history = history.slice(0, 10)

  // Save back to cookies
  cookieStore.set("scan-history", JSON.stringify(history), {
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })
}

// Get scan history from cookies
export async function getScanHistory() {
  const cookieStore = cookies()
  const existingHistory = cookieStore.get("scan-history")

  if (!existingHistory) {
    return []
  }

  try {
    return JSON.parse(existingHistory.value)
  } catch {
    return []
  }
}

// Clear scan history
export async function clearScanHistory() {
  const cookieStore = cookies()
  cookieStore.set("scan-history", "", { maxAge: 0, path: "/" })
  return true
}

