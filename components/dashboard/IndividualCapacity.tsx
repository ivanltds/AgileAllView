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

interface IndividualCapacityProps {
  teamId: string;
  filters: any;
}

export default function IndividualCapacity({ teamId, filters }: IndividualCapacityProps) {
  const [individualData, setIndividualData] = useState<any[]>([]);
  const [averageData, setAverageData] = useState<any[]>([]);

  useEffect(() => {
    loadIndividualCapacity();
  }, [teamId, filters]);

  const loadIndividualCapacity = async () => {
    const { data: workItems } = await supabase
      .from("work_items")
      .select("assigned_to, story_points, state, closed_date")
      .eq("team_id", teamId)
      .in("state", ["Done", "Closed"])
      .not("assigned_to", "is", null);

    if (workItems && workItems.length > 0) {
      const memberMap = new Map<string, number>();

      workItems.forEach((wi) => {
        if (wi.assigned_to) {
          const current = memberMap.get(wi.assigned_to) || 0;
          memberMap.set(wi.assigned_to, current + (wi.story_points || 0));
        }
      });

      const chartData = Array.from(memberMap.entries())
        .map(([member, points]) => ({
          member,
          storyPoints: points,
        }))
        .sort((a, b) => b.storyPoints - a.storyPoints);

      setIndividualData(chartData);

      const now = new Date();
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

      const recentWorkItems = workItems.filter((wi) => {
        if (!wi.closed_date) return false;
        const closedDate = new Date(wi.closed_date);
        return closedDate >= fourWeeksAgo && closedDate <= now;
      });

      const avgMemberMap = new Map<string, number[]>();

      recentWorkItems.forEach((wi) => {
        if (wi.assigned_to && wi.story_points) {
          const current = avgMemberMap.get(wi.assigned_to) || [];
          current.push(wi.story_points);
          avgMemberMap.set(wi.assigned_to, current);
        }
      });

      const avgData = Array.from(avgMemberMap.entries())
        .map(([member, points]) => ({
          member,
          avgStoryPoints: Math.round((points.reduce((sum, p) => sum + p, 0) / 4) * 100) / 100,
        }))
        .sort((a, b) => b.avgStoryPoints - a.avgStoryPoints);

      setAverageData(avgData);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Story Points Delivered</CardTitle>
        </CardHeader>
        <CardContent>
          {individualData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={individualData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="member" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="storyPoints" fill="#0ea5e9" name="Story Points" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No individual capacity data available.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4-Week Average Delivery</CardTitle>
        </CardHeader>
        <CardContent>
          {averageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={averageData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="member" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgStoryPoints" fill="#10b981" name="Avg Story Points / Week" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">
              Not enough data for 4-week average.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
