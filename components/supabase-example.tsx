// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SupabaseExample() {
  const [data, setData] = useState<unknown[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()

  const fetchData = async () => {
    setLoading(true)
    try {
      // Example query using the existing "users" table
      const { data: result, error } = await supabase.from("users").select("*").limit(10)

      if (error) throw error
      setData(result || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={fetchData} disabled={loading}>
          {loading ? "Loading..." : "Test Database Connection"}
        </Button>

        {data.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Data from your database:</h3>
            <pre className="bg-muted p-2 rounded text-sm overflow-auto">{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
