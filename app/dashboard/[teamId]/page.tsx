"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSession } from "@/lib/auth/session";
import { supabase } from "@/lib/supabase/client";
import { AzureDevOpsClient } from "@/lib/azure/client";
import { AzureSync } from "@/lib/azure/sync";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import MetricsOverview from "@/components/dashboard/MetricsOverview";
import CapacityView from "@/components/dashboard/CapacityView";
import IndividualCapacity from "@/components/dashboard/IndividualCapacity";
import TeamSimulator from "@/components/dashboard/TeamSimulator";

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filters, setFilters] = useState({
    iteration: "all",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push("/");
      return;
    }

    loadTeam();
  }, [teamId, router]);

  const loadTeam = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .maybeSingle();

    if (error || !data) {
      router.push("/teams");
      return;
    }

    setTeam(data);
    setIsLoading(false);
  };

  const handleSync = async () => {
    const session = getSession();
    if (!session || !team) return;

    setIsSyncing(true);

    try {
      const azureClient = new AzureDevOpsClient({
        organization: team.organization,
        project: team.project,
        teamId: team.team_id,
        pat: session.pat,
      });

      const sync = new AzureSync(azureClient, team.id);
      await sync.syncAll({
        teamId: team.team_id,
        areaPath: team.area_path,
      });

      alert("Sync completed successfully!");
    } catch (error: any) {
      alert("Sync failed: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/teams")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {team?.name}
                </h1>
                <p className="text-sm text-gray-500">
                  {team?.organization} / {team?.project}
                </p>
              </div>
            </div>
            <Button onClick={handleSync} disabled={isSyncing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Data"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <DashboardFilters
          teamId={teamId}
          filters={filters}
          onFiltersChange={setFilters}
        />

        <Tabs defaultValue="metrics" className="mt-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="capacity">Capacity</TabsTrigger>
            <TabsTrigger value="individual">Individual</TabsTrigger>
            <TabsTrigger value="simulator">Simulator</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="mt-6">
            <MetricsOverview teamId={teamId} filters={filters} />
          </TabsContent>

          <TabsContent value="capacity" className="mt-6">
            <CapacityView teamId={teamId} filters={filters} />
          </TabsContent>

          <TabsContent value="individual" className="mt-6">
            <IndividualCapacity teamId={teamId} filters={filters} />
          </TabsContent>

          <TabsContent value="simulator" className="mt-6">
            <TeamSimulator teamId={teamId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
