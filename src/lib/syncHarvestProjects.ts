import { supabase } from "@/integrations/supabase/client";
import { getProjects, calculateProjectDuration, getTimeEntries } from "@/integrations/harvest/client";
import { Project } from "@/types";
import { v4 as uuidv4 } from 'uuid';

// List of projects to be automatically deleted
const PROJECTS_TO_DELETE = [
  "Time off",
  "Business Development",
  "Administration",
  "HR",
  "Marketing",
  "Product Development",
  "Training",
  "Internal Events",
  "Marketing ABM Engine",
  "IT & Operations",
  "Knowledge management",
  "Bakyla",
  "Ducati",
  "HVD",
  "HVD_Astera Solutions",
  "Astera",
  "Taleva Company",
  "HVD_German_cables",
  "Operations & Finance Project",
  "Solifos Non-Billable"
];

export const syncHarvestProjects = async () => {
  try {
    // 1. Fetch all projects from Harvest
    console.log("Fetching projects from Harvest...");
    const harvestProjects = await getProjects();
    console.log(`Found ${harvestProjects.length} projects in Harvest`);
    
    let successCount = 0;
    let errorCount = 0;
    let deletedCount = 0;
    const errors: string[] = [];

    // 2. Process each project
    for (const harvestProject of harvestProjects) {
      try {
        console.log(`Processing project: ${harvestProject.name} (${harvestProject.id})`);
        
        // Check if project should be deleted
        if (PROJECTS_TO_DELETE.includes(harvestProject.name)) {
          console.log(`Project ${harvestProject.name} is in the deletion list, will be deleted`);
          
          // Check if project exists in Supabase
          const { data: existingProject, error: selectError } = await supabase
            .from('projects')
            .select('*')
            .eq('harvest_id', harvestProject.id.toString())
            .single();

          if (existingProject) {
            // Delete the project
            const { error: deleteError } = await supabase
              .from('projects')
              .delete()
              .eq('harvest_id', harvestProject.id.toString());

            if (deleteError) {
              throw new Error(`Error deleting project: ${deleteError.message}`);
            }
            console.log(`Successfully deleted project ${harvestProject.name}`);
            deletedCount++;
          }
          continue; // Skip to next project
        }
        
        // Check if project has time entries
        const timeEntries = await getTimeEntries(harvestProject.id);
        if (timeEntries.length === 0) {
          console.log(`Project ${harvestProject.name} has no time entries, will be deleted`);
          
          // Check if project exists in Supabase
          const { data: existingProject, error: selectError } = await supabase
            .from('projects')
            .select('*')
            .eq('harvest_id', harvestProject.id.toString())
            .single();

          if (existingProject) {
            // Delete the project
            const { error: deleteError } = await supabase
              .from('projects')
              .delete()
              .eq('harvest_id', harvestProject.id.toString());

            if (deleteError) {
              throw new Error(`Error deleting project: ${deleteError.message}`);
            }
            console.log(`Successfully deleted project ${harvestProject.name}`);
            deletedCount++;
          }
          continue; // Skip to next project
        }
        
        // Calculate project duration based on time entries
        console.log(`Calculating duration for project ${harvestProject.id}...`);
        const { startDate, endDate } = await calculateProjectDuration(harvestProject.id);
        console.log(`Duration calculated: ${startDate} to ${endDate}`);

        // Generate a UUID for the project
        const projectUUID = uuidv4();

        // Prepare project data for Supabase
        const projectData = {
          id: projectUUID,
          harvest_id: harvestProject.id.toString(), // Store the original Harvest ID
          name: harvestProject.name,
          start_date: startDate,
          end_date: endDate,
          industry: "Other", // Default value, can be updated later
          type: "Other", // Default value, can be updated later
          tools: ["none"], // Default value, can be updated later
          description: harvestProject.notes || undefined
        };

        console.log(`Checking if project ${projectData.id} exists in Supabase...`);
        // 3. Check if project exists in Supabase
        const { data: existingProject, error: selectError } = await supabase
          .from('projects')
          .select('*')
          .eq('harvest_id', harvestProject.id.toString())
          .single();

        if (selectError) {
          if (selectError.code === 'PGRST116' || selectError.code === '406') {
            console.log(`Project ${projectData.id} does not exist, will insert`);
          } else {
            throw new Error(`Error checking project existence: ${selectError.message}`);
          }
        }

        if (existingProject) {
          console.log(`Updating existing project ${projectData.id}...`);
          // Update existing project
          const { error: updateError } = await supabase
            .from('projects')
            .update(projectData)
            .eq('harvest_id', harvestProject.id.toString());

          if (updateError) {
            throw new Error(`Error updating project: ${updateError.message}`);
          }
          console.log(`Successfully updated project ${projectData.id}`);
        } else {
          console.log(`Inserting new project ${projectData.id}...`);
          // Insert new project
          const { error: insertError } = await supabase
            .from('projects')
            .insert([projectData]);

          if (insertError) {
            throw new Error(`Error inserting project: ${insertError.message}`);
          }
          console.log(`Successfully inserted project ${projectData.id}`);
        }

        successCount++;
      } catch (error: any) {
        errorCount++;
        const errorMessage = `Project ${harvestProject.name} (${harvestProject.id}): ${error.message}`;
        errors.push(errorMessage);
        console.error(errorMessage);
      }
    }

    return { 
      success: true, 
      message: `Projects synced successfully. ${successCount} projects processed, ${deletedCount} projects deleted, ${errorCount} errors.`,
      details: errors.length > 0 ? errors : undefined
    };
  } catch (error: any) {
    console.error("Error syncing projects:", error);
    return { 
      success: false, 
      error: error.message || "Unknown error occurred during sync" 
    };
  }
}; 