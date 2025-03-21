import { Suspense } from "react"
import UrlScannerForm from "@/components/url-scanner-form"
import ScanHistory from "@/components/scan-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-24 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">URL Scanner</h1>
          <p className="text-muted-foreground">
            Scan any URL to check for security issues and get detailed information
          </p>
        </div>

        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan">Scan URL</TabsTrigger>
            <TabsTrigger value="history">Scan History</TabsTrigger>
          </TabsList>
          <TabsContent value="scan" className="mt-6">
            <Suspense fallback={<div>Loading scanner...</div>}>
              <UrlScannerForm />
            </Suspense>
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <Suspense fallback={<div>Loading history...</div>}>
              <ScanHistory />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

