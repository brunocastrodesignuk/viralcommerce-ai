"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { format } from "date-fns";

interface DataPoint {
  time: string;
  avg_viral_score: number;
  count: number;
}

interface ViralTimelineProps {
  data: DataPoint[];
}

export function ViralTimeline({ data }: ViralTimelineProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(d.time), "HH:mm"),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6B7280" }} />
        <Tooltip
          contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
          labelStyle={{ color: "#9CA3AF" }}
          itemStyle={{ color: "#38BDF8" }}
        />
        <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="4 4" label={{ value: "Viral", fill: "#EF4444", fontSize: 10 }} />
        <Line
          type="monotone"
          dataKey="avg_viral_score"
          name="Avg Viral Score"
          stroke="#38BDF8"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#38BDF8" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
