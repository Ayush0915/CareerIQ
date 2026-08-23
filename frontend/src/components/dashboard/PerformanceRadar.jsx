import React from 'react'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'

/* Split out so recharts loads only when the Score & Fit tab is opened.
   It was previously imported statically into a tab component, putting ~100KB
   gzipped into the main bundle for a single chart. */
export default function PerformanceRadar({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data}>
        <PolarGrid stroke="#F0F1F5" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'Inter' }}
        />
        <Radar
          dataKey="A"
          stroke="#5147E5"
          fill="#5147E5"
          fillOpacity={0.1}
          strokeWidth={2}
          dot={{ fill: '#5147E5', r: 3 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
