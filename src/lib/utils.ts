import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Project, ExperienceMetrics, Industry, ProjectType, HumaticaTool } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Calculate months between two dates
export function getMonthsBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months += end.getMonth() - start.getMonth();
  
  // Add partial month if there are days remaining
  if (end.getDate() > start.getDate()) {
    months += end.getDate() / 30 - start.getDate() / 30;
  }
  
  return Math.max(0, Math.ceil(months)); // Always round up to nearest month
}

// Calculate experience metrics for a set of projects
export function calculateExperienceMetrics(projects: Project[]): ExperienceMetrics {
  const metrics: ExperienceMetrics = {
    totalProjects: projects.length,
    totalMonths: 0,
    byIndustry: {} as Record<Industry, { projects: number; months: number }>,
    byType: {} as Record<ProjectType, { projects: number; months: number }>,
    byTool: {} as Record<HumaticaTool, { projects: number; months: number }>,
  };

  // Initialize records
  const industries = ["Technology", "Healthcare", "Financial Services", "Manufacturing", 
                     "Retail", "Energy", "Education", "Telecommunications", "Other"] as Industry[];
  
  const projectTypes = ["Align and activate", "Right-sizing", "PMI", 
                       "Org DD", "TOM implementation", "Other"] as ProjectType[];
  
  const tools = ["altus", "modas", "none"] as HumaticaTool[];
  
  industries.forEach(industry => {
    metrics.byIndustry[industry] = { projects: 0, months: 0 };
  });
  
  projectTypes.forEach(type => {
    metrics.byType[type] = { projects: 0, months: 0 };
  });
  
  tools.forEach(tool => {
    metrics.byTool[tool] = { projects: 0, months: 0 };
  });
  
  // Calculate metrics
  projects.forEach(project => {
    const months = getMonthsBetween(project.startDate, project.endDate);
    metrics.totalMonths += months;
    
    // By industry
    metrics.byIndustry[project.industry].projects += 1;
    metrics.byIndustry[project.industry].months += months;
    
    // By project type
    metrics.byType[project.type].projects += 1;
    metrics.byType[project.type].months += months;
    
    // By tool
    project.tools.forEach(tool => {
      metrics.byTool[tool].projects += 1;
      metrics.byTool[tool].months += months;
    });
  });
  
  // Round total months
  metrics.totalMonths = Math.round(metrics.totalMonths * 10) / 10;
  
  return metrics;
}

// Format date to display in a user-friendly way
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'short'
  }).format(date);
}

// Get color for industry
export function getIndustryColor(industry: Industry): string {
  const colorMap: Record<Industry, string> = {
    "Technology": "bg-blue-400",
    "Healthcare": "bg-green-400",
    "Financial Services": "bg-purple-400",
    "Manufacturing": "bg-orange-400",
    "Retail": "bg-pink-400",
    "Energy": "bg-yellow-400",
    "Education": "bg-teal-400",
    "Telecommunications": "bg-indigo-400",
    "Other": "bg-gray-400"
  };
  
  return colorMap[industry] || "bg-gray-400";
}

// Get color for project type
export function getProjectTypeColor(type: ProjectType): string {
  return "bg-gray-200 text-gray-700"; // Light grey for all project types
}

// Get color for Humatica tool
export function getToolColor(tool: HumaticaTool): string {
  const colorMap: Record<HumaticaTool, string> = {
    "altus": "bg-blue-400",
    "modas": "bg-purple-400",
    "none": "bg-gray-400"
  };
  
  return colorMap[tool] || "bg-gray-400";
}

// Calculate experience level based on project count
export function getExperienceLevel(count: number): string {
  if (count >= 15) return "Expert";
  if (count >= 10) return "Advanced";
  if (count >= 5) return "Intermediate";
  return "Beginner";
}
