"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface CapacityViewProps {
  teamId: string;
  filters: any;
}

export default function CapacityView({ teamId, filters }: CapacityViewProps) {
  const [capacityData, setCapacityData] = useState<any[]>([]);
  const [daysOffData, setDaysOffData] = useState<any[]>([]);

  useEffect(() => {
    loadCapacity();
  }, [teamId, filters]);

  const loadCapacity = async () => {
    let query = supabase
      .from("capacity")
      .select("*, iterations(name, start_date, finish_date)")
      .eq("iterations.team_id", teamId);

    if (filters.iteration !== "all") {
      query = query.eq("iteration_id", filters.iteration);
    }

    const { data: capacities } = await query;

    if (capacities && capacities.length > 0) {
      const activityMap = new Map<string, number>();

      capacities.forEach((cap) => {
        const current = activityMap.get(cap.activity_name) || 0;
        activityMap.set(cap.activity_name, current + cap.capacity_per_day);
      });

      const chartData = Array.from(activityMap.entries()).map(([activity, capacity]) => ({
        activity,
        capacity: Math.round(capacity * 100) / 100,
      }));

      setCapacityData(chartData);

      const daysOff = capacities
        .filter((cap) => cap.days_off && (cap.days_off as any).length > 0)
        .map((cap) => ({
          member: cap.team_member_name,
          daysOff: (cap.days_off as any).length,
          dates: (cap.days_off as any).map((d: any) => d.start).join(", "),
        }));

      setDaysOffData(daysOff);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Capacity by Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {capacityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={capacityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="activity" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="capacity" fill="#0ea5e9" name="Capacity per Day" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No capacity data available. Sync data to view capacity.
            </p>
          )}
        </CardContent>
      </Card>

      {daysOffData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Days Off</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {daysOffData.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-yellow-50 border border-yellow-200 rounded-md"
                >
                  <p className="font-medium text-gray-900">{item.member}</p>
                  <p className="text-sm text-gray-600">
                    {item.daysOff} day(s) off
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{item.dates}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
