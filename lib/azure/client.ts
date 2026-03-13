export interface AzureDevOpsConfig {
  organization: string;
  project: string;
  teamId: string;
  pat: string;
}

export class AzureDevOpsClient {
  private config: AzureDevOpsConfig;
  private baseUrl: string;

  constructor(config: AzureDevOpsConfig) {
    this.config = config;
    this.baseUrl = `https://dev.azure.com/${config.organization}/${config.project}`;
  }

  private getHeaders(): HeadersInit {
    const auth = Buffer.from(`:${this.config.pat}`).toString("base64");
    return {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    };
  }

  async queryWorkItems(wiql: string): Promise<any> {
    const url = `${this.baseUrl}/_apis/wit/wiql?api-version=7.0`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ query: wiql }),
    });

    if (!response.ok) {
      throw new Error(`Azure DevOps API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getWorkItems(ids: number[], expand?: string): Promise<any> {
    if (ids.length === 0) return { value: [] };

    const idsParam = ids.join(",");
    const expandParam = expand ? `&$expand=${expand}` : "";
    const url = `${this.baseUrl}/_apis/wit/workitems?ids=${idsParam}${expandParam}&api-version=7.0`;

    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Azure DevOps API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getWorkItemRevisions(id: number): Promise<any> {
    const url = `${this.baseUrl}/_apis/wit/workitems/${id}/revisions?api-version=7.0`;

    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Azure DevOps API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getIterations(): Promise<any> {
    const url = `${this.baseUrl}/${this.config.teamId}/_apis/work/teamsettings/iterations?api-version=7.0`;

    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Azure DevOps API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getIterationCapacity(iterationId: string): Promise<any> {
    const url = `${this.baseUrl}/${this.config.teamId}/_apis/work/teamsettings/iterations/${iterationId}/capacities?api-version=7.0`;

    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Azure DevOps API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getTeamMembers(): Promise<any> {
    const url = `https://dev.azure.com/${this.config.organization}/_apis/projects/${this.config.project}/teams/${this.config.teamId}/members?api-version=7.0`;

    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Azure DevOps API error: ${response.statusText}`);
    }

    return response.json();
  }
}
