// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
'use client';

import * as d3 from 'd3';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

interface Module {
  id: number;
  name: string;
  progress: number;
  issues: number;
}

interface RadialProgressChartProps {
  modules: Module[];
}

interface TooltipState {
  module: Module;
  x: number;
  y: number;
}

const getModuleColor = (progress: number) => {
  if (progress === 100) return '#166534'; // Dark green
  if (progress >= 80) return '#22c55e'; // Light green
  if (progress >= 60) return '#eab308'; // Yellow
  return '#ef4444'; // Red
};

function RadialProgressChartComponent({ modules }: RadialProgressChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  const data = useMemo(
    () =>
      modules.map((module) => ({
        id: module.id,
        name: module.name,
        value: module.progress,
        issues: module.issues,
        color: getModuleColor(module.progress),
      })),
    [modules],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setChartWidth(Math.max(0, Math.floor(rect.width)));
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svgElement = svgRef.current;
    const container = containerRef.current;
    if (!svgElement || !container || chartWidth <= 0 || data.length === 0) return;

    const height = 300;
    const radius = Math.max(50, Math.min(chartWidth, height) / 2 - 16);
    const innerRadius = radius * 0.58;
    const outerRadius = radius * 0.88;

    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();
    svg
      .attr('viewBox', `0 0 ${chartWidth} ${height}`)
      .attr('width', chartWidth)
      .attr('height', height);

    const root = svg
      .append('g')
      .attr('transform', `translate(${chartWidth / 2},${height / 2})`);

    const pie = d3
      .pie<(typeof data)[number]>()
      .sort(null)
      .value((d) => Math.max(1, d.value));
    const pieData = pie(data);

    const arc = d3
      .arc<d3.PieArcDatum<(typeof data)[number]>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);
    const arcActive = d3
      .arc<d3.PieArcDatum<(typeof data)[number]>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius + 10);

    const slices = root
      .selectAll<SVGPathElement, d3.PieArcDatum<(typeof data)[number]>>('path')
      .data(pieData, (d) => d.data.id)
      .join('path')
      .attr('fill', (d) => d.data.color)
      .attr('stroke', 'hsl(var(--background))')
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer')
      .on('mouseenter', (_event, d) => {
        setActiveModuleId(d.data.id);
      })
      .on('mousemove', (event, d) => {
        const [x, y] = d3.pointer(event, container);
        setTooltip({
          module: modules.find((module) => module.id === d.data.id) ?? {
            id: d.data.id,
            name: d.data.name,
            progress: d.data.value,
            issues: d.data.issues,
          },
          x,
          y,
        });
      })
      .on('mouseleave', () => {
        setActiveModuleId(null);
        setTooltip(null);
      });

    slices
      .transition()
      .duration(220)
      .attr('d', (d) => (activeModuleId === d.data.id ? arcActive(d) : arc(d)) ?? '');

    const avgProgress = Math.round(d3.mean(data, (d) => d.value) ?? 0);
    root
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -2)
      .attr('class', 'fill-foreground text-xl font-semibold')
      .text(`${avgProgress}%`);
    root
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 18)
      .attr('class', 'fill-muted-foreground text-xs')
      .text('Avg readiness');
  }, [activeModuleId, chartWidth, data, modules]);

  if (modules.length === 0) {
    return (
      <div className='flex h-[300px] items-center justify-center text-sm text-muted-foreground'>
        No module data available.
      </div>
    );
  }

  return (
    <div className='w-full'>
      <div ref={containerRef} className='relative h-[300px] w-full'>
        <svg
          ref={svgRef}
          role='img'
          aria-label='Donut chart showing completion percentages and issue counts by IND module'
          className='h-full w-full'
        />

        {tooltip && (
          <div
            className='pointer-events-none absolute z-10 rounded-md border bg-background/95 px-2.5 py-1.5 text-xs shadow-md'
            style={{
              left: Math.min(tooltip.x + 12, Math.max(chartWidth - 170, 0)),
              top: Math.max(tooltip.y - 18, 8),
            }}
          >
            <div className='font-semibold'>{tooltip.module.name}</div>
            <div className='text-muted-foreground'>
              {tooltip.module.progress}% complete, {tooltip.module.issues}{' '}
              {tooltip.module.issues === 1 ? 'issue' : 'issues'}
            </div>
          </div>
        )}
      </div>

      <div className='mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2'>
        {modules.map((module) => {
          const isActive = module.id === activeModuleId;
          return (
            <button
              key={module.id}
              type='button'
              className='flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition-colors hover:bg-muted/50'
              style={{
                borderColor: isActive ? getModuleColor(module.progress) : undefined,
                boxShadow: isActive
                  ? `inset 0 0 0 1px ${getModuleColor(module.progress)}`
                  : undefined,
              }}
              onMouseEnter={() => setActiveModuleId(module.id)}
              onMouseLeave={() => setActiveModuleId(null)}
              onFocus={() => setActiveModuleId(module.id)}
              onBlur={() => setActiveModuleId(null)}
            >
              <span className='flex items-center gap-2'>
                <span
                  className='inline-block h-2.5 w-2.5 rounded-sm'
                  style={{ backgroundColor: getModuleColor(module.progress) }}
                />
                <span className='truncate'>Module {module.id}</span>
              </span>
              <span className='text-muted-foreground'>
                {module.progress}% ({module.issues})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const RadialProgressChart = memo(RadialProgressChartComponent);
RadialProgressChart.displayName = 'RadialProgressChart';
