"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle, ExternalLink, Shield } from "lucide-react"
import { scanUrl } from "@/lib/actions"

export default function UrlScannerForm() {
  const [url, setUrl] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsScanning(true)
    setError(null)
    setScanResult(null)

    try {
      const result = await scanUrl(url)
      setScanResult(result)
      setUrl("")
    } catch (err: any) {
      setError(err.message || "An error occurred while scanning the URL")
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter URL to scan (e.g., https://example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" disabled={isScanning || !url}>
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning
              </>
            ) : (
              "Scan URL"
            )}
          </Button>
        </div>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {scanResult && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium">Scan Results</h3>
                  <p className="text-sm text-muted-foreground">
                    URL:{" "}
                    <a
                      href={scanResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline flex-inline items-center"
                    >
                      {scanResult.url} <ExternalLink className="inline h-3 w-3 ml-1" />
                    </a>
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${
                    scanResult.safe ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {scanResult.safe ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Safe
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Potentially Unsafe
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Domain Information</h4>
                  <div className="text-sm">
                    <p>
                      <span className="font-medium">Domain:</span> {scanResult.domain}
                    </p>
                    <p>
                      <span className="font-medium">IP Address:</span> {scanResult.ipAddress || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">HTTP Status:</span> {scanResult.statusCode}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Security Analysis</h4>
                  <div className="text-sm">
                    <p>
                      <span className="font-medium">SSL/TLS:</span>{" "}
                      {scanResult.https ? "Secure (HTTPS)" : "Not Secure (HTTP)"}
                    </p>
                    <p>
                      <span className="font-medium">Blocklist Status:</span>{" "}
                      {scanResult.blocklisted ? "Listed" : "Not Listed"}
                    </p>
                    <p>
                      <span className="font-medium">Risk Score:</span> {scanResult.riskScore}/10
                    </p>
                  </div>
                </div>
              </div>

              {scanResult.warnings && scanResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Warnings</h4>
                  <ul className="text-sm space-y-1">
                    {scanResult.warnings.map((warning: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <AlertTriangle className="h-4 w-4 mr-2 text-amber-500 mt-0.5" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Full Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

