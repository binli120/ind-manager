"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Sector } from "recharts"
import { useState } from "react"

interface Module {
  id: number
  name: string
  progress: number
  issues: number
}

interface RadialProgressChartProps {
  modules: Module[]
}

const getModuleColor = (progress: number) => {
  console.log("[v0] Module progress:", progress)
  if (progress === 100) return "#166534" // Dark green
  if (progress >= 80) return "#22c55e" // Light green
  if (progress >= 60) return "#eab308" // Yellow
  return "#ef4444" // Red
}

export function RadialProgressChart({ modules }: RadialProgressChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

  const data = modules.map((module, index) => ({
    name: `Module ${module.id}`,
    value: module.progress,
    issues: module.issues,
    color: getModuleColor(module.progress),
  }))

  console.log("[v0] Chart data with colors:", data)

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={outerRadius + 12}
          outerRadius={outerRadius + 16}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(undefined)}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend
            formatter={(value, entry: any) => {
              return `${value}: ${entry.payload.value}% (${entry.payload.issues} issues)`
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
