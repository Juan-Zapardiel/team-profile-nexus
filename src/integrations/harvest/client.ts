import axios from 'axios';

// Harvest API types
export interface HarvestProject {
  id: number;
  name: string;
  code: string;
  starts_on: string;
  ends_on: string | null;
  is_active: boolean;
  is_billable: boolean;
  is_fixed_fee: boolean;
  bill_by: string;
  budget: number | null;
  budget_by: string;
  budget_is_monthly: boolean;
  notify_when_over_budget: boolean;
  over_budget_notification_percentage: number;
  show_budget_to_all: boolean;
  created_at: string;
  updated_at: string;
  notes: string | null;
  cost_budget: number | null;
  cost_budget_include_expenses: boolean;
  hourly_rate: number | null;
  fee: number | null;
}

export interface HarvestTimeEntry {
  id: number;
  spent_date: string;
  hours: number;
  notes: string | null;
  is_locked: boolean;
  locked_reason: string | null;
  is_closed: boolean;
  is_billed: boolean;
  timer_started_at: string | null;
  started_time: string | null;
  ended_time: string | null;
  is_running: boolean;
  billable: boolean;
  budgeted: boolean;
  billable_rate: number | null;
  cost_rate: number | null;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
  };
  client: {
    id: number;
    name: string;
  };
  project: {
    id: number;
    name: string;
  };
  task: {
    id: number;
    name: string;
  };
  user_assignment: {
    id: number;
    is_project_manager: boolean;
    is_active: boolean;
    use_default_rates: boolean;
    budget: number | null;
    created_at: string;
    updated_at: string;
    hourly_rate: number | null;
  };
  task_assignment: {
    id: number;
    billable: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    hourly_rate: number | null;
    budget: number | null;
  };
}

class HarvestClient {
  private baseURL = 'https://api.harvestapp.com/v2';
  private accessToken: string;
  private accountId: string;

  constructor(accessToken: string, accountId: string) {
    this.accessToken = accessToken;
    this.accountId = accountId;
  }

  private get headers() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Harvest-Account-ID': this.accountId,
      'Content-Type': 'application/json',
    };
  }

  async getProjects(): Promise<HarvestProject[]> {
    const response = await axios.get(`${this.baseURL}/projects`, {
      headers: this.headers,
      params: {
        is_active: true,
      },
    });
    return response.data.projects;
  }

  async getTimeEntries(startDate: string, endDate: string): Promise<HarvestTimeEntry[]> {
    const response = await axios.get(`${this.baseURL}/time_entries`, {
      headers: this.headers,
      params: {
        from: startDate,
        to: endDate,
      },
    });
    return response.data.time_entries;
  }

  async getProjectTimeEntries(projectId: number, startDate: string, endDate: string): Promise<HarvestTimeEntry[]> {
    const response = await axios.get(`${this.baseURL}/time_entries`, {
      headers: this.headers,
      params: {
        project_id: projectId,
        from: startDate,
        to: endDate,
      },
    });
    return response.data.time_entries;
  }
}

// Create and export a singleton instance
let harvestClient: HarvestClient | null = null;

export const initHarvestClient = (accessToken: string, accountId: string) => {
  harvestClient = new HarvestClient(accessToken, accountId);
  return harvestClient;
};

export const getHarvestClient = () => {
  if (!harvestClient) {
    throw new Error('Harvest client not initialized. Call initHarvestClient first.');
  }
  return harvestClient;
}; 