// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
'use client';

import { useState } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';

interface Module {
  id: number;
  name: string;
  progress: number;
  issues: number;
}

interface RadialProgressChartProps {
  modules: Module[];
}

const getModuleColor = (progress: number) => {
  //console.log("[v0] Module progress:", progress)
  if (progress === 100) return '#166534'; // Dark green
  if (progress >= 80) return '#22c55e'; // Light green
  if (progress >= 60) return '#eab308'; // Yellow
  return '#ef4444'; // Red
};

export function RadialProgressChart({ modules }: RadialProgressChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const data = modules.map((module) => ({
    name: `Module ${module.id}`,
    value: module.progress,
    issues: module.issues,
    color: getModuleColor(module.progress),
  }));

  //console.log("[v0] Chart data with colors:", data)

  const renderActiveShape = ({
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  }: PieSectorDataItem) => {
    const safeOuter = outerRadius ?? 0;
    const safeInner = innerRadius ?? 0;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={safeInner}
          outerRadius={safeOuter + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={safeOuter + 12}
          outerRadius={safeOuter + 16}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <div className='w-full'>
      <ResponsiveContainer width='100%' height={300}>
        <PieChart>
          <Pie
            data={data}
            cx='50%'
            cy='50%'
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey='value'
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
            formatter={(
              value: string,
              entry: { payload?: { value?: number; issues?: number } }
            ) => {
              const percent = entry.payload?.value ?? 0;
              const issues = entry.payload?.issues ?? 0;
              return `${value}: ${percent}% (${issues} issues)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
