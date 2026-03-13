"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    organization: string;
    project: string;
  };
}

export default function TeamCard({ team }: TeamCardProps) {
  const router = useRouter();

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader>
        <CardTitle className="text-lg">{team.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div>
            <span className="font-medium">Organization:</span> {team.organization}
          </div>
          <div>
            <span className="font-medium">Project:</span> {team.project}
          </div>
        </div>
        <Button
          className="w-full"
          onClick={() => router.push(`/dashboard/${team.id}`)}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Open Dashboard
        </Button>
      </CardContent>
    </Card>
  );
}
