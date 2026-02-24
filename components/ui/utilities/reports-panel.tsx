'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  Brain,
  Clock,
  Download,
  Play,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// AI Token usage data
const tokenData = [
  { month: 'Sep', prompt: 245000, completion: 180000, total: 425000 },
  { month: 'Oct', prompt: 312000, completion: 215000, total: 527000 },
  { month: 'Nov', prompt: 287000, completion: 198000, total: 485000 },
  { month: 'Dec', prompt: 398000, completion: 265000, total: 663000 },
  { month: 'Jan', prompt: 456000, completion: 312000, total: 768000 },
  { month: 'Feb', prompt: 523000, completion: 348000, total: 871000 },
];

const modelBreakdown = [
  { name: 'GPT-4o', tokens: 1420000, cost: '$42.60', pct: 45 },
  { name: 'GPT-4o Mini', tokens: 980000, cost: '$2.94', pct: 31 },
  { name: 'Text Embedding', tokens: 540000, cost: '$0.54', pct: 17 },
  { name: 'GPT-3.5 Turbo', tokens: 220000, cost: '$0.33', pct: 7 },
];

// User activity data
const dailyLogins = [
  { day: 'Mon', logins: 142 },
  { day: 'Tue', logins: 168 },
  { day: 'Wed', logins: 155 },
  { day: 'Thu', logins: 189 },
  { day: 'Fri', logins: 176 },
  { day: 'Sat', logins: 54 },
  { day: 'Sun', logins: 38 },
];

const moduleUsage = [
  { name: 'IND Submission', value: 34, color: 'oklch(0.541 0.192 277)' },
  { name: 'AI Analysis', value: 28, color: 'oklch(0.6 0.118 184.704)' },
  { name: 'Post Submission', value: 18, color: 'oklch(0.646 0.222 41.116)' },
  { name: 'Design System', value: 12, color: 'oklch(0.828 0.189 84.429)' },
  { name: 'Calendar', value: 8, color: 'oklch(0.769 0.188 70.08)' },
];

const sessionTrend = [
  { week: 'W1', avgMinutes: 24, sessions: 820 },
  { week: 'W2', avgMinutes: 28, sessions: 910 },
  { week: 'W3', avgMinutes: 26, sessions: 875 },
  { week: 'W4', avgMinutes: 31, sessions: 960 },
  { week: 'W5', avgMinutes: 29, sessions: 940 },
  { week: 'W6', avgMinutes: 33, sessions: 1020 },
  { week: 'W7', avgMinutes: 35, sessions: 1080 },
  { week: 'W8', avgMinutes: 32, sessions: 1050 },
];

function AITokenReport() {
  return (
    <div className='flex flex-col gap-6'>
      {/* Summary cards */}
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <SummaryCard
          label='Total Tokens (Feb)'
          value='871K'
          change='+13.4%'
          icon={Zap}
        />
        <SummaryCard
          label='Prompt Tokens'
          value='523K'
          change='+14.7%'
          icon={Brain}
        />
        <SummaryCard
          label='Completion Tokens'
          value='348K'
          change='+11.5%'
          icon={TrendingUp}
        />
        <SummaryCard
          label='Est. Cost (Feb)'
          value='$46.41'
          change='+9.2%'
          icon={BarChart3}
        />
      </div>

      <div className='flex flex-col gap-6 lg:flex-row'>
        {/* Token trend chart */}
        <div className='flex-1 rounded-lg border border-border bg-card p-5'>
          <h4 className='mb-4 text-sm font-semibold text-foreground'>
            Token Usage Trend (6 Months)
          </h4>
          <ResponsiveContainer width='100%' height={280}>
            <BarChart data={tokenData}>
              <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
              <XAxis
                dataKey='month'
                className='text-xs'
                tick={{ fill: 'oklch(0.505 0.02 277)' }}
              />
              <YAxis
                className='text-xs'
                tick={{ fill: 'oklch(0.505 0.02 277)' }}
                tickFormatter={(v) => `${v / 1000}K`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid oklch(0.915 0.008 277)',
                  backgroundColor: 'white',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [
                  `${(value / 1000).toFixed(0)}K tokens`,
                  '',
                ]}
              />
              <Bar
                dataKey='prompt'
                name='Prompt'
                fill='oklch(0.541 0.192 277)'
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey='completion'
                name='Completion'
                fill='oklch(0.541 0.192 277 / 0.4)'
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Model breakdown */}
        <div className='w-full rounded-lg border border-border bg-card p-5 lg:w-80'>
          <h4 className='mb-4 text-sm font-semibold text-foreground'>
            Model Breakdown
          </h4>
          <div className='flex flex-col gap-3'>
            {modelBreakdown.map((model) => (
              <div
                key={model.name}
                className='rounded-md border border-border bg-background p-3'
              >
                <div className='mb-1.5 flex items-center justify-between'>
                  <span className='text-sm font-medium text-foreground'>
                    {model.name}
                  </span>
                  <span className='text-xs font-semibold text-primary'>
                    {model.cost}
                  </span>
                </div>
                <div className='mb-1.5 h-1.5 overflow-hidden rounded-full bg-muted'>
                  <div
                    className='h-full rounded-full bg-primary'
                    style={{ width: `${model.pct}%` }}
                  />
                </div>
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>{(model.tokens / 1000).toFixed(0)}K tokens</span>
                  <span>{model.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserActivityReport() {
  return (
    <div className='flex flex-col gap-6'>
      {/* Summary cards */}
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <SummaryCard
          label='Daily Active Users'
          value='189'
          change='+8.6%'
          icon={Users}
        />
        <SummaryCard
          label='Avg. Session Duration'
          value='32 min'
          change='+6.7%'
          icon={Clock}
        />
        <SummaryCard
          label='Weekly Sessions'
          value='1,050'
          change='+11.8%'
          icon={TrendingUp}
        />
        <SummaryCard
          label='Most Active Module'
          value='IND Sub.'
          change='34%'
          icon={BarChart3}
        />
      </div>

      <div className='flex flex-col gap-6 lg:flex-row'>
        {/* Daily logins */}
        <div className='flex-1 rounded-lg border border-border bg-card p-5'>
          <h4 className='mb-4 text-sm font-semibold text-foreground'>
            Daily Logins (This Week)
          </h4>
          <ResponsiveContainer width='100%' height={240}>
            <BarChart data={dailyLogins}>
              <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
              <XAxis
                dataKey='day'
                tick={{ fill: 'oklch(0.505 0.02 277)', fontSize: 12 }}
              />
              <YAxis tick={{ fill: 'oklch(0.505 0.02 277)', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid oklch(0.915 0.008 277)',
                  backgroundColor: 'white',
                  fontSize: '12px',
                }}
              />
              <Bar
                dataKey='logins'
                name='Logins'
                fill='oklch(0.541 0.192 277)'
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Module usage pie */}
        <div className='w-full rounded-lg border border-border bg-card p-5 lg:w-80'>
          <h4 className='mb-4 text-sm font-semibold text-foreground'>
            Module Usage Distribution
          </h4>
          <ResponsiveContainer width='100%' height={240}>
            <PieChart>
              <Pie
                data={moduleUsage}
                cx='50%'
                cy='50%'
                innerRadius={55}
                outerRadius={85}
                dataKey='value'
                nameKey='name'
                paddingAngle={3}
              >
                {moduleUsage.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid oklch(0.915 0.008 277)',
                  backgroundColor: 'white',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value}%`, '']}
              />
              <Legend
                iconType='circle'
                iconSize={8}
                wrapperStyle={{ fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Session trend */}
      <div className='rounded-lg border border-border bg-card p-5'>
        <h4 className='mb-4 text-sm font-semibold text-foreground'>
          Avg. Session Duration Trend (8 Weeks)
        </h4>
        <ResponsiveContainer width='100%' height={220}>
          <AreaChart data={sessionTrend}>
            <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
            <XAxis
              dataKey='week'
              tick={{ fill: 'oklch(0.505 0.02 277)', fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: 'oklch(0.505 0.02 277)', fontSize: 12 }}
              unit=' min'
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid oklch(0.915 0.008 277)',
                backgroundColor: 'white',
                fontSize: '12px',
              }}
            />
            <Area
              type='monotone'
              dataKey='avgMinutes'
              name='Avg. Minutes'
              stroke='oklch(0.541 0.192 277)'
              fill='oklch(0.541 0.192 277 / 0.15)'
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  change,
  icon: Icon,
}: {
  label: string;
  value: string;
  change: string;
  icon: React.ElementType;
}) {
  return (
    <div className='rounded-lg border border-border bg-card p-4'>
      <div className='mb-2 flex items-center justify-between'>
        <span className='text-xs text-muted-foreground'>{label}</span>
        <div className='flex size-7 items-center justify-center rounded-md bg-primary/10'>
          <Icon className='size-3.5 text-primary' />
        </div>
      </div>
      <p className='text-xl font-bold text-foreground'>{value}</p>
      <p className='mt-0.5 text-xs text-emerald-600'>
        {change} <span className='text-muted-foreground'>vs last period</span>
      </p>
    </div>
  );
}

export function ReportsPanel() {
  const [reportType, setReportType] = useState('ai-tokens');
  const [dateRange, setDateRange] = useState('30d');

  return (
    <div className='flex flex-col gap-5'>
      {/* Controls */}
      <div className='flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center'>
        <div className='flex items-center gap-3'>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className='w-56 bg-card'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ai-tokens'>
                <Brain className='mr-1.5 inline size-3.5' />
                AI / OpenAI Token Usage
              </SelectItem>
              <SelectItem value='user-activity'>
                <Users className='mr-1.5 inline size-3.5' />
                User Activity Trends
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className='w-36 bg-card'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7d'>Last 7 days</SelectItem>
              <SelectItem value='30d'>Last 30 days</SelectItem>
              <SelectItem value='90d'>Last 90 days</SelectItem>
              <SelectItem value='6m'>Last 6 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm'>
            <Play className='mr-1.5 size-3.5' />
            Run Report
          </Button>
          <Button variant='outline' size='sm'>
            <Download className='mr-1.5 size-3.5' />
            Export
          </Button>
        </div>
      </div>

      {/* Report content */}
      {reportType === 'ai-tokens' ? <AITokenReport /> : <UserActivityReport />}
    </div>
  );
}
