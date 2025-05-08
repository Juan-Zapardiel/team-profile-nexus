import axios from 'axios';

const HARVEST_API_URL = 'https://api.harvestapp.com/v2';
const HARVEST_ACCESS_TOKEN = import.meta.env.VITE_HARVEST_ACCESS_TOKEN;
const HARVEST_ACCOUNT_ID = import.meta.env.VITE_HARVEST_ACCOUNT_ID;

// Validate environment variables
if (!HARVEST_ACCESS_TOKEN) {
  console.error('Missing VITE_HARVEST_ACCESS_TOKEN environment variable');
}
if (!HARVEST_ACCOUNT_ID) {
  console.error('Missing VITE_HARVEST_ACCOUNT_ID environment variable');
}

const harvestClient = axios.create({
  baseURL: HARVEST_API_URL,
  headers: {
    'Authorization': `Bearer ${HARVEST_ACCESS_TOKEN}`,
    'Harvest-Account-Id': HARVEST_ACCOUNT_ID,
  }
});

// Add response interceptor for debugging
harvestClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Harvest API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Harvest API No Response:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Harvest API Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Harvest API types
export interface HarvestProject {
  id: number;
  name: string;
  code: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_billable: boolean;
  is_fixed_fee: boolean;
  bill_by: string;
  budget: number;
  budget_by: string;
  notes: string;
  client: {
    id: number;
    name: string;
  };
  cost_budget: number;
  cost_budget_include_expenses: boolean;
  created_at: string;
  updated_at: string;
}

export interface HarvestTimeEntry {
  id: number;
  spent_date: string;
  hours: number;
  notes: string;
  project: {
    id: number;
    name: string;
  };
  task: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface HarvestUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const getProjects = async (): Promise<HarvestProject[]> => {
  try {
    console.log('Fetching projects from Harvest API...');
    const response = await harvestClient.get('/projects');
    console.log(`Successfully fetched ${response.data.projects.length} projects from Harvest`);
    return response.data.projects;
  } catch (error) {
    console.error('Error fetching Harvest projects:', error);
    throw error;
  }
};

export const getTimeEntries = async (projectId: number): Promise<HarvestTimeEntry[]> => {
  try {
    console.log(`Fetching time entries for project ${projectId}...`);
    const response = await harvestClient.get('/time_entries', {
      params: {
        project_id: projectId,
        per_page: 100 // Adjust as needed
      }
    });
    console.log(`Successfully fetched ${response.data.time_entries.length} time entries for project ${projectId}`);
    return response.data.time_entries;
  } catch (error) {
    console.error(`Error fetching time entries for project ${projectId}:`, error);
    throw error;
  }
};

export const calculateProjectDuration = async (projectId: number): Promise<{ startDate: string; endDate: string }> => {
  try {
    const timeEntries = await getTimeEntries(projectId);
    
    if (timeEntries.length === 0) {
      // Get the project details to use its actual dates
      const response = await harvestClient.get(`/projects/${projectId}`);
      const project = response.data;
      
      return {
        startDate: project.starts_on || new Date().toISOString().split('T')[0],
        endDate: project.ends_on || new Date().toISOString().split('T')[0]
      };
    }

    // Sort time entries by date
    const sortedEntries = timeEntries.sort((a, b) => 
      new Date(a.spent_date).getTime() - new Date(b.spent_date).getTime()
    );

    return {
      startDate: sortedEntries[0].spent_date,
      endDate: sortedEntries[sortedEntries.length - 1].spent_date
    };
  } catch (error) {
    console.error(`Error calculating duration for project ${projectId}:`, error);
    throw error;
  }
};

export const getUsers = async (): Promise<HarvestUser[]> => {
  try {
    const response = await harvestClient.get('/users');
    return response.data.users;
  } catch (error) {
    console.error('Error fetching Harvest users:', error);
    throw error;
  }
};

export const getProjectDetails = async (projectId: number): Promise<{
  project: HarvestProject;
  timeEntries: HarvestTimeEntry[];
}> => {
  try {
    console.log(`Fetching details for project ${projectId}...`);
    
    // Get project details
    const projectResponse = await harvestClient.get(`/projects/${projectId}`);
    console.log('Project details:', projectResponse.data);
    
    // Get time entries
    const timeEntriesResponse = await harvestClient.get('/time_entries', {
      params: {
        project_id: projectId,
        per_page: 100
      }
    });
    console.log(`Found ${timeEntriesResponse.data.time_entries.length} time entries`);
    
    return {
      project: projectResponse.data,
      timeEntries: timeEntriesResponse.data.time_entries
    };
  } catch (error) {
    console.error(`Error fetching project details for ${projectId}:`, error);
    throw error;
  }
}; 