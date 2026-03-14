'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

// Static demo data — replace with real queries when analytics service is built
const ACTIVITY_DATA = [
  { date: 'Mon', jobs: 12 },
  { date: 'Tue', jobs: 15 },
  { date: 'Wed', jobs: 18 },
  { date: 'Thu', jobs: 14 },
  { date: 'Fri', jobs: 22 },
  { date: 'Sat', jobs: 8 },
  { date: 'Sun', jobs: 5 },
]

const ISSUE_DATA = [
  { issue: 'Low Refrigerant',     count: 28 },
  { issue: 'Airflow Restriction', count: 22 },
  { issue: 'Compressor Issue',    count: 15 },
  { issue: 'Electrical',          count: 12 },
  { issue: 'Thermostat',          count: 8 },
]

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
  },
}

interface DashboardChartsProps {
  tenantId: string
}

export default function DashboardCharts({ tenantId }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle>Service Activity (This Week)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={ACTIVITY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="jobs" stroke="#FFD100" strokeWidth={2} dot={{ fill: '#FFD100' }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Most Common Issues (This Month)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ISSUE_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="issue" width={140} stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#FFD100" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
