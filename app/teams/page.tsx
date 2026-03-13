"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSession, clearSession } from "@/lib/auth/session";
import { supabase } from "@/lib/supabase/client";
import TeamCard from "@/components/teams/TeamCard";
import AddTeamDialog from "@/components/teams/AddTeamDialog";

interface Team {
  id: string;
  name: string;
  organization: string;
  project: string;
  team_id: string;
  area_path: string;
}

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      router.push("/");
      return;
    }
    setSession(currentSession);
    loadTeams();
  }, [router]);

  const loadTeams = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTeams(data);
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  const handleTeamAdded = () => {
    loadTeams();
    setShowAddDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">AgileAllView</h1>
            <p className="text-sm text-gray-500">Welcome, {session?.username}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Teams</h2>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Team
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-white rounded-lg animate-pulse" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No teams added yet</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Team
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </main>

      <AddTeamDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onTeamAdded={handleTeamAdded}
      />
    </div>
  );
}
