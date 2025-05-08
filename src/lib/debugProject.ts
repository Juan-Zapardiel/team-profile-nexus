import { getProjectDetails } from "@/integrations/harvest/client";

export const debugProject = async (projectName: string) => {
  try {
    // First get all projects to find the one we're looking for
    const response = await fetch('https://api.harvestapp.com/v2/projects', {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_HARVEST_ACCESS_TOKEN}`,
        'Harvest-Account-Id': import.meta.env.VITE_HARVEST_ACCOUNT_ID,
      }
    });
    
    const data = await response.json();
    const project = data.projects.find((p: any) => p.name === projectName);
    
    if (!project) {
      console.error(`Project "${projectName}" not found`);
      return;
    }
    
    console.log(`Found project: ${project.name} (ID: ${project.id})`);
    console.log('Project details:', project);
    
    // Get time entries
    const timeEntriesResponse = await fetch(`https://api.harvestapp.com/v2/time_entries?project_id=${project.id}`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_HARVEST_ACCESS_TOKEN}`,
        'Harvest-Account-Id': import.meta.env.VITE_HARVEST_ACCOUNT_ID,
      }
    });
    
    const timeEntriesData = await timeEntriesResponse.json();
    console.log(`Found ${timeEntriesData.time_entries.length} time entries`);
    console.log('Time entries:', timeEntriesData.time_entries);
    
  } catch (error) {
    console.error('Error debugging project:', error);
  }
}; 