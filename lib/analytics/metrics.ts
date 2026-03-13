import { supabase } from "@/lib/supabase/client";

export interface TimeInState {
  state: string;
  totalDays: number;
}

export interface WorkItemMetrics {
  id: number;
  title: string;
  leadTimeDays: number;
  cycleTimeDays: number;
  timeInStates: TimeInState[];
}

export class MetricsCalculator {
  async calculateWorkItemMetrics(workItemId: number): Promise<WorkItemMetrics | null> {
    const { data: workItem } = await supabase
      .from("work_items")
      .select("*")
      .eq("id", workItemId)
      .maybeSingle();

    if (!workItem) return null;

    const { data: revisions } = await supabase
      .from("revisions")
      .select("*")
      .eq("work_item_id", workItemId)
      .order("revised_date", { ascending: true });

    if (!revisions || revisions.length === 0) return null;

    const timeInStates = this.calculateTimeInStates(revisions);
    const leadTimeDays = this.calculateLeadTime(revisions, workItem);
    const cycleTimeDays = this.calculateCycleTime(revisions);

    return {
      id: workItemId,
      title: workItem.title,
      leadTimeDays,
      cycleTimeDays,
      timeInStates,
    };
  }

  private calculateTimeInStates(revisions: any[]): TimeInState[] {
    const stateTimeMap = new Map<string, number>();

    for (let i = 0; i < revisions.length; i++) {
      const current = revisions[i];
      const next = revisions[i + 1];

      const currentState = current.state;
      if (!currentState) continue;

      const startDate = new Date(current.revised_date);
      const endDate = next ? new Date(next.revised_date) : new Date();

      const durationMs = endDate.getTime() - startDate.getTime();
      const durationDays = durationMs / (1000 * 60 * 60 * 24);

      const currentTime = stateTimeMap.get(currentState) || 0;
      stateTimeMap.set(currentState, currentTime + durationDays);
    }

    return Array.from(stateTimeMap.entries()).map(([state, totalDays]) => ({
      state,
      totalDays: Math.round(totalDays * 100) / 100,
    }));
  }

  private calculateLeadTime(revisions: any[], workItem: any): number {
    const createdDate = new Date(workItem.created_date);
    const closedDate = workItem.closed_date ? new Date(workItem.closed_date) : new Date();

    const durationMs = closedDate.getTime() - createdDate.getTime();
    return Math.round((durationMs / (1000 * 60 * 60 * 24)) * 100) / 100;
  }

  private calculateCycleTime(revisions: any[]): number {
    const inProgressStates = ["Active", "In Progress", "Committed"];
    const doneStates = ["Done", "Closed", "Resolved"];

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    for (const rev of revisions) {
      if (!startDate && inProgressStates.includes(rev.state)) {
        startDate = new Date(rev.revised_date);
      }

      if (doneStates.includes(rev.state)) {
        endDate = new Date(rev.revised_date);
      }
    }

    if (!startDate) return 0;
    if (!endDate) endDate = new Date();

    const durationMs = endDate.getTime() - startDate.getTime();
    return Math.round((durationMs / (1000 * 60 * 60 * 24)) * 100) / 100;
  }

  async saveMetrics(teamId: string, workItemId: number): Promise<void> {
    const metrics = await this.calculateWorkItemMetrics(workItemId);
    if (!metrics) return;

    const { data: workItem } = await supabase
      .from("work_items")
      .select("iteration_path")
      .eq("id", workItemId)
      .maybeSingle();

    const { data: iteration } = await supabase
      .from("iterations")
      .select("id")
      .eq("team_id", teamId)
      .eq("path", workItem?.iteration_path)
      .maybeSingle();

    await supabase.from("metrics").insert({
      team_id: teamId,
      work_item_id: workItemId,
      iteration_id: iteration?.id,
      lead_time_days: metrics.leadTimeDays,
      cycle_time_days: metrics.cycleTimeDays,
      time_in_states: metrics.timeInStates.reduce((acc, item) => {
        acc[item.state] = item.totalDays;
        return acc;
      }, {} as Record<string, number>),
      calculated_at: new Date().toISOString(),
    });
  }
}

export interface ThroughputData {
  period: string;
  count: number;
  storyPoints: number;
}

export async function calculateThroughput(
  teamId: string,
  groupBy: "sprint" | "week" = "sprint"
): Promise<ThroughputData[]> {
  const { data: workItems } = await supabase
    .from("work_items")
    .select("*, iterations(name, start_date, finish_date)")
    .eq("team_id", teamId)
    .in("state", ["Done", "Closed"]);

  if (!workItems) return [];

  if (groupBy === "sprint") {
    const throughputMap = new Map<string, ThroughputData>();

    for (const wi of workItems) {
      const iterationName = (wi as any).iterations?.name || "Unknown";

      if (!throughputMap.has(iterationName)) {
        throughputMap.set(iterationName, {
          period: iterationName,
          count: 0,
          storyPoints: 0,
        });
      }

      const data = throughputMap.get(iterationName)!;
      data.count += 1;
      data.storyPoints += wi.story_points || 0;
    }

    return Array.from(throughputMap.values());
  }

  return [];
}

export interface PlannedVsRealized {
  iteration: string;
  planned: number;
  realized: number;
}

export async function calculatePlannedVsRealized(teamId: string): Promise<PlannedVsRealized[]> {
  const { data: iterations } = await supabase
    .from("iterations")
    .select("*")
    .eq("team_id", teamId)
    .order("start_date", { ascending: false })
    .limit(6);

  if (!iterations) return [];

  const results: PlannedVsRealized[] = [];

  for (const iteration of iterations) {
    const { data: allWorkItems } = await supabase
      .from("work_items")
      .select("story_points, state")
      .eq("team_id", teamId)
      .eq("iteration_path", iteration.path);

    const planned = allWorkItems?.reduce((sum, wi) => sum + (wi.story_points || 0), 0) || 0;

    const { data: doneWorkItems } = await supabase
      .from("work_items")
      .select("story_points")
      .eq("team_id", teamId)
      .eq("iteration_path", iteration.path)
      .in("state", ["Done", "Closed"]);

    const realized = doneWorkItems?.reduce((sum, wi) => sum + (wi.story_points || 0), 0) || 0;

    results.push({
      iteration: iteration.name,
      planned,
      realized,
    });
  }

  return results.reverse();
}
