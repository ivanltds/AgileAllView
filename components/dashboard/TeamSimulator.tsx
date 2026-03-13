"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamSimulatorProps {
  teamId: string;
}

interface TeamMember {
  name: string;
  avgStoryPoints: number;
}

export default function TeamSimulator({ teamId }: TeamSimulatorProps) {
  const [availableMembers, setAvailableMembers] = useState<TeamMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([]);
  const [estimatedCapacity, setEstimatedCapacity] = useState(0);

  useEffect(() => {
    loadTeamMembers();
  }, [teamId]);

  useEffect(() => {
    calculateEstimatedCapacity();
  }, [selectedMembers]);

  const loadTeamMembers = async () => {
    const { data: workItems } = await supabase
      .from("work_items")
      .select("assigned_to, story_points, closed_date, state")
      .eq("team_id", teamId)
      .in("state", ["Done", "Closed"])
      .not("assigned_to", "is", null);

    if (workItems && workItems.length > 0) {
      const now = new Date();
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

      const recentWorkItems = workItems.filter((wi) => {
        if (!wi.closed_date) return false;
        const closedDate = new Date(wi.closed_date);
        return closedDate >= fourWeeksAgo && closedDate <= now;
      });

      const memberMap = new Map<string, number[]>();

      recentWorkItems.forEach((wi) => {
        if (wi.assigned_to && wi.story_points) {
          const current = memberMap.get(wi.assigned_to) || [];
          current.push(wi.story_points);
          memberMap.set(wi.assigned_to, current);
        }
      });

      const members = Array.from(memberMap.entries()).map(([name, points]) => ({
        name,
        avgStoryPoints: Math.round((points.reduce((sum, p) => sum + p, 0) / 4) * 100) / 100,
      }));

      setAvailableMembers(members);
    }
  };

  const calculateEstimatedCapacity = () => {
    const total = selectedMembers.reduce((sum, m) => sum + m.avgStoryPoints, 0);
    setEstimatedCapacity(Math.round(total * 100) / 100);
  };

  const handleAddMember = (memberName: string) => {
    const member = availableMembers.find((m) => m.name === memberName);
    if (member && !selectedMembers.find((m) => m.name === memberName)) {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  const handleRemoveMember = (memberName: string) => {
    setSelectedMembers(selectedMembers.filter((m) => m.name !== memberName));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Composition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select onValueChange={handleAddMember}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers
                    .filter((m) => !selectedMembers.find((sm) => sm.name === m.name))
                    .map((member) => (
                      <SelectItem key={member.name} value={member.name}>
                        {member.name} ({member.avgStoryPoints} pts/week)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {selectedMembers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No members selected. Add members to see estimated capacity.
                </p>
              ) : (
                selectedMembers.map((member) => (
                  <div
                    key={member.name}
                    className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-600">
                        {member.avgStoryPoints} pts/week average
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.name)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estimated Team Capacity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-5xl font-bold text-blue-600">{estimatedCapacity}</p>
            <p className="text-lg text-gray-600 mt-2">Story Points per Week</p>
            <p className="text-sm text-gray-500 mt-4">
              Based on 4-week average of selected members
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
