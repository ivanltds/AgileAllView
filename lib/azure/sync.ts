import { AzureDevOpsClient } from "./client";
import { supabase } from "@/lib/supabase/client";

export interface SyncOptions {
  teamId: string;
  areaPath: string;
}

export class AzureSync {
  private client: AzureDevOpsClient;
  private teamDbId: string;

  constructor(client: AzureDevOpsClient, teamDbId: string) {
    this.client = client;
    this.teamDbId = teamDbId;
  }

  async syncAll(options: SyncOptions): Promise<void> {
    await this.syncIterations();
    await this.syncWorkItems(options.areaPath);
  }

  async syncIterations(): Promise<void> {
    const response = await this.client.getIterations();
    const iterations = response.value || [];

    for (const iteration of iterations) {
      const { error } = await supabase.from("iterations").upsert(
        {
          team_id: this.teamDbId,
          iteration_id: iteration.id,
          name: iteration.name,
          path: iteration.path,
          start_date: iteration.attributes.startDate,
          finish_date: iteration.attributes.finishDate,
          synced_at: new Date().toISOString(),
        },
        {
          onConflict: "team_id,iteration_id",
        }
      );

      if (error) {
        console.error("Error syncing iteration:", error);
      }

      await this.syncIterationCapacity(iteration.id);
    }
  }

  async syncIterationCapacity(iterationId: string): Promise<void> {
    try {
      const response = await this.client.getIterationCapacity(iterationId);
      const capacities = response.value || [];

      const { data: iterationData } = await supabase
        .from("iterations")
        .select("id")
        .eq("iteration_id", iterationId)
        .eq("team_id", this.teamDbId)
        .maybeSingle();

      if (!iterationData) return;

      for (const cap of capacities) {
        for (const activity of cap.activities || []) {
          await supabase.from("capacity").insert({
            iteration_id: iterationData.id,
            team_member_id: cap.teamMember.id,
            team_member_name: cap.teamMember.displayName,
            activity_name: activity.name,
            capacity_per_day: activity.capacityPerDay,
            days_off: cap.daysOff || [],
            synced_at: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Error syncing capacity:", error);
    }
  }

  async syncWorkItems(areaPath: string): Promise<void> {
    const wiql = `
      SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType],
             [Microsoft.VSTS.Scheduling.StoryPoints], [System.CreatedDate],
             [System.ClosedDate], [System.AssignedTo], [System.IterationPath], [System.AreaPath]
      FROM WorkItems
      WHERE [System.AreaPath] UNDER '${areaPath}'
        AND [System.WorkItemType] IN ('Product Backlog Item', 'Bug', 'Task')
      ORDER BY [System.CreatedDate] DESC
    `;

    const queryResult = await this.client.queryWorkItems(wiql);
    const workItemRefs = queryResult.workItems || [];

    if (workItemRefs.length === 0) return;

    const ids = workItemRefs.map((ref: any) => ref.id);
    const batchSize = 200;

    for (let i = 0; i < ids.length; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize);
      const workItemsResponse = await this.client.getWorkItems(batchIds);
      const workItems = workItemsResponse.value || [];

      for (const wi of workItems) {
        const fields = wi.fields;

        await supabase.from("work_items").upsert(
          {
            id: wi.id,
            team_id: this.teamDbId,
            title: fields["System.Title"],
            work_item_type: fields["System.WorkItemType"],
            state: fields["System.State"],
            story_points: fields["Microsoft.VSTS.Scheduling.StoryPoints"] || 0,
            created_date: fields["System.CreatedDate"],
            closed_date: fields["System.ClosedDate"],
            assigned_to: fields["System.AssignedTo"]?.displayName,
            iteration_path: fields["System.IterationPath"],
            area_path: fields["System.AreaPath"],
            raw_data: fields,
            synced_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        );

        await this.syncWorkItemRevisions(wi.id);
      }
    }
  }

  async syncWorkItemRevisions(workItemId: number): Promise<void> {
    try {
      const response = await this.client.getWorkItemRevisions(workItemId);
      const revisions = response.value || [];

      for (const rev of revisions) {
        const fields = rev.fields;

        await supabase.from("revisions").upsert(
          {
            work_item_id: workItemId,
            rev: rev.rev,
            revised_date: fields["System.ChangedDate"] || fields["System.CreatedDate"],
            revised_by: fields["System.ChangedBy"]?.displayName,
            state: fields["System.State"],
            changed_fields: fields,
            raw_data: rev,
          },
          {
            onConflict: "work_item_id,rev",
          }
        );
      }
    } catch (error) {
      console.error(`Error syncing revisions for work item ${workItemId}:`, error);
    }
  }
}
