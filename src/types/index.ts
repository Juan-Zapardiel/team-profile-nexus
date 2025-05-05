export type ProjectType = 
  | "Align and activate"
  | "Right-sizing"
  | "PMI"
  | "Org DD"
  | "TOM implementation"
  | "Other";

export type Industry =
  | "Technology"
  | "Healthcare"
  | "Financial Services"
  | "Manufacturing"
  | "Retail"
  | "Energy"
  | "Education"
  | "Telecommunications"
  | "Other";

export type HumaticaTool = "altus" | "modas" | "none";

export interface Project {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  industry: Industry;
  type: ProjectType;
  tools: HumaticaTool[];
  description?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  jobTitle: string;
  location: string;
  email: string;
  avatar: string;
  bio?: string;
  projectIds: string[];
  startDate?: string;
}

export interface ExperienceMetrics {
  totalProjects: number;
  totalMonths: number;
  byIndustry: Record<Industry, { projects: number; months: number }>;
  byType: Record<ProjectType, { projects: number; months: number }>;
  byTool: Record<HumaticaTool, { projects: number; months: number }>;
}
