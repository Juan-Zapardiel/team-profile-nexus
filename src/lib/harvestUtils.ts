import { Project, Industry, ProjectType, HumaticaTool } from "@/types";
import { HarvestProject, HarvestTimeEntry } from "@/integrations/harvest/client";

// Map Harvest project names to our industry types
const industryMap: Record<string, Industry> = {
  "Technology": "Technology",
  "Healthcare": "Healthcare",
  "Financial Services": "Financial Services",
  "Manufacturing": "Manufacturing",
  "Retail": "Retail",
  "Energy": "Energy",
  "Education": "Education",
  "Telecommunications": "Telecommunications",
  "Other": "Other"
};

// Map Harvest project names to our project types
const projectTypeMap: Record<string, ProjectType> = {
  "Align and activate": "Align and activate",
  "Right-sizing": "Right-sizing",
  "PMI": "PMI",
  "Org DD": "Org DD",
  "TOM implementation": "TOM implementation",
  "Other": "Other"
};

// Default to "Other" if no match is found
const getIndustry = (projectName: string): Industry => {
  const matchedIndustry = Object.keys(industryMap).find(industry => 
    projectName.toLowerCase().includes(industry.toLowerCase())
  );
  return matchedIndustry ? industryMap[matchedIndustry] : "Other";
};

const getProjectType = (projectName: string): ProjectType => {
  const matchedType = Object.keys(projectTypeMap).find(type => 
    projectName.toLowerCase().includes(type.toLowerCase())
  );
  return matchedType ? projectTypeMap[matchedType] : "Other";
};

// Convert Harvest project to our Project type
export const convertHarvestProject = (harvestProject: HarvestProject): Project => {
  return {
    id: harvestProject.id.toString(),
    name: harvestProject.name,
    startDate: new Date(harvestProject.starts_on),
    endDate: harvestProject.ends_on ? new Date(harvestProject.ends_on) : new Date(),
    industry: getIndustry(harvestProject.name),
    type: getProjectType(harvestProject.name),
    tools: ["none"], // Default to none, can be updated based on project notes or other criteria
    description: harvestProject.notes || undefined
  };
};

// Get unique users who have logged time on a project
export const getProjectTeamMembers = (timeEntries: HarvestTimeEntry[]): string[] => {
  const uniqueUsers = new Set(timeEntries.map(entry => entry.user.name));
  return Array.from(uniqueUsers);
};

// Calculate total hours logged on a project
export const getProjectTotalHours = (timeEntries: HarvestTimeEntry[]): number => {
  return timeEntries.reduce((total, entry) => total + entry.hours, 0);
};

// Get time entries for a specific user on a project
export const getUserProjectTimeEntries = (
  timeEntries: HarvestTimeEntry[],
  userName: string
): HarvestTimeEntry[] => {
  return timeEntries.filter(entry => entry.user.name === userName);
}; 