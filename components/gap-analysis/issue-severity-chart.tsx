// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface Module {
  id: number
  name: string
  sectionsDetail: Array<{
    id: string
    name: string
    status: string
    assignee: string
  }>
}

interface IssueSeverityChartProps {
  modules: Module[]
}

export function IssueSeverityChart({ modules }: IssueSeverityChartProps) {
  // Transform data to count severity by module
  const chartData = modules.map((module) => {
    const critical = module.sectionsDetail.filter((s) => s.status === "issues").length
    const warning = module.sectionsDetail.filter((s) => s.status === "warning").length
    const missing = module.sectionsDetail.filter((s) => s.status === "missing").length

    return {
      name: `Module ${module.id}`,
      Critical: critical,
      Warning: warning,
      Missing: missing,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
          }}
        />
        <Legend />
        <Bar dataKey="Critical" fill="hsl(var(--error))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Warning" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Missing" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
