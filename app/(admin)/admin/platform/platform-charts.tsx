'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const PLATFORM_ACTIVITY = [
  { date: 'Mar 8',  jobs: 312, readings: 1889 },
  { date: 'Mar 9',  jobs: 267, readings: 1623 },
  { date: 'Mar 10', jobs: 298, readings: 1756 },
  { date: 'Mar 11', jobs: 334, readings: 1945 },
  { date: 'Mar 12', jobs: 356, readings: 2103 },
  { date: 'Mar 13', jobs: 311, readings: 1890 },
  { date: 'Mar 14', jobs: 278, readings: 1724 },
]

const TENANT_ACTIVITY = [
  { name: 'ABC HVAC',        jobs: 45 },
  { name: 'CoolTech',        jobs: 38 },
  { name: 'Climate Control', jobs: 32 },
  { name: 'Air Masters',     jobs: 28 },
  { name: 'Premier HVAC',    jobs: 24 },
]

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.875rem' },
}

export default function PlatformCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle>Platform Activity (Last 7 Days)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={PLATFORM_ACTIVITY}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <Tooltip {...TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="jobs"     stroke="#FFD100" strokeWidth={2} name="Jobs" />
              <Line type="monotone" dataKey="readings" stroke="#FF6A13" strokeWidth={2} name="Readings" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Most Active Tenants</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={TENANT_ACTIVITY}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="jobs" fill="#FFD100" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
