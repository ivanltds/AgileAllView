"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { calculatePlannedVsRealized, calculateThroughput } from "@/lib/analytics/metrics";

interface MetricsOverviewProps {
  teamId: string;
  filters: any;
}

export default function MetricsOverview({ teamId, filters }: MetricsOverviewProps) {
  const [leadTimeData, setLeadTimeData] = useState<any[]>([]);
  const [cycleTimeData, setCycleTimeData] = useState<any[]>([]);
  const [throughputData, setThroughputData] = useState<any[]>([]);
  const [plannedVsRealizedData, setPlannedVsRealizedData] = useState<any[]>([]);
  const [timeInStatesData, setTimeInStatesData] = useState<any[]>([]);

  useEffect(() => {
    loadMetrics();
  }, [teamId, filters]);

  const loadMetrics = async () => {
    let query = supabase
      .from("metrics")
      .select("*, work_items(title), iterations(name)")
      .eq("team_id", teamId);

    if (filters.iteration !== "all") {
      query = query.eq("iteration_id", filters.iteration);
    }

    const { data: metrics } = await query;

    if (metrics && metrics.length > 0) {
      const leadTime = metrics.map((m) => ({
        name: (m as any).work_items?.title?.substring(0, 20) || "Unknown",
        days: m.lead_time_days,
      }));
      setLeadTimeData(leadTime.slice(0, 10));

      const cycleTime = metrics.map((m) => ({
        name: (m as any).work_items?.title?.substring(0, 20) || "Unknown",
        days: m.cycle_time_days,
      }));
      setCycleTimeData(cycleTime.slice(0, 10));

      const statesMap = new Map<string, number>();
      metrics.forEach((m) => {
        const timeInStates = m.time_in_states as any;
        Object.entries(timeInStates).forEach(([state, time]) => {
          const current = statesMap.get(state) || 0;
          statesMap.set(state, current + (time as number));
        });
      });

      const statesData = Array.from(statesMap.entries()).map(([state, totalDays]) => ({
        state,
        avgDays: Math.round((totalDays / metrics.length) * 100) / 100,
      }));
      setTimeInStatesData(statesData);
    }

    const throughput = await calculateThroughput(teamId);
    setThroughputData(throughput);

    const plannedVsRealized = await calculatePlannedVsRealized(teamId);
    setPlannedVsRealizedData(plannedVsRealized);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Planned vs Realized</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={plannedVsRealizedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="iteration" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="planned" fill="#94a3b8" name="Planned" />
                <Bar dataKey="realized" fill="#0ea5e9" name="Realized" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Throughput</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={throughputData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0ea5e9" name="PBIs Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Time (Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={leadTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="days" stroke="#0ea5e9" name="Lead Time" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cycle Time (Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cycleTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="days" stroke="#10b981" name="Cycle Time" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Average Time in Each State (Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeInStatesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="state" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgDays" fill="#f59e0b" name="Avg Days" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
