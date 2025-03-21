"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, Clock, Trash2 } from "lucide-react"
import { getScanHistory, clearScanHistory } from "@/lib/actions"

type ScanHistoryItem = {
  id: string
  url: string
  timestamp: number
  safe: boolean
  riskScore: number
}

export default function ScanHistory() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getScanHistory()
        setHistory(data)
      } catch (error) {
        console.error("Failed to load scan history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [])

  const handleClearHistory = async () => {
    try {
      await clearScanHistory()
      setHistory([])
    } catch (error) {
      console.error("Failed to clear history:", error)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading scan history...</div>
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No scan history available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Recent Scans</h2>
        <Button variant="outline" size="sm" onClick={handleClearHistory}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear History
        </Button>
      </div>

      <div className="space-y-4">
        {history.map((item) => (
          <Card key={item.id}>
            <CardHeader className="py-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-medium truncate max-w-[70%]">{item.url}</CardTitle>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${
                    item.safe ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {item.safe ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Safe
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Risk Score: {item.riskScore}/10
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-xs text-muted-foreground flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(item.timestamp).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

