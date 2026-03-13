"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase/client";

interface DashboardFiltersProps {
  teamId: string;
  filters: any;
  onFiltersChange: (filters: any) => void;
}

export default function DashboardFilters({
  teamId,
  filters,
  onFiltersChange,
}: DashboardFiltersProps) {
  const [iterations, setIterations] = useState<any[]>([]);

  useEffect(() => {
    loadIterations();
  }, [teamId]);

  const loadIterations = async () => {
    const { data } = await supabase
      .from("iterations")
      .select("*")
      .eq("team_id", teamId)
      .order("start_date", { ascending: false });

    if (data) {
      setIterations(data);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Sprint / Iteration</Label>
            <Select
              value={filters.iteration}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, iteration: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select iteration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sprints</SelectItem>
                {iterations.map((iter) => (
                  <SelectItem key={iter.id} value={iter.id}>
                    {iter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
