
import { Project, TeamMember, Industry, ProjectType, HumaticaTool } from "../types";

// Generate projects
export const projects: Project[] = [
  {
    id: "p1",
    name: "Project Alpha",
    startDate: new Date("2022-01-01"),
    endDate: new Date("2022-04-30"),
    industry: "Technology",
    type: "Align and activate",
    tools: ["altus"],
    description: "Helped a tech company align departments after a merger."
  },
  {
    id: "p2",
    name: "Project Beta",
    startDate: new Date("2022-03-15"),
    endDate: new Date("2022-08-20"),
    industry: "Financial Services",
    type: "Right-sizing",
    tools: ["modas"],
    description: "Optimized team structure for a financial institution."
  },
  {
    id: "p3",
    name: "Project Gamma",
    startDate: new Date("2022-06-01"),
    endDate: new Date("2022-09-15"),
    industry: "Healthcare",
    type: "PMI",
    tools: ["altus", "modas"],
    description: "Post-merger integration for healthcare providers."
  },
  {
    id: "p4",
    name: "Project Delta",
    startDate: new Date("2022-08-01"),
    endDate: new Date("2022-12-31"),
    industry: "Manufacturing",
    type: "Org DD",
    tools: ["modas"],
    description: "Organizational due diligence for manufacturing acquisition."
  },
  {
    id: "p5",
    name: "Project Epsilon",
    startDate: new Date("2023-01-15"),
    endDate: new Date("2023-04-30"),
    industry: "Retail",
    type: "TOM implementation",
    tools: ["altus"],
    description: "New target operating model for retail chain."
  },
  {
    id: "p6",
    name: "Project Zeta",
    startDate: new Date("2021-05-01"),
    endDate: new Date("2021-08-31"),
    industry: "Energy",
    type: "Right-sizing",
    tools: ["none"],
    description: "Workforce optimization for energy company."
  },
  {
    id: "p7",
    name: "Project Eta",
    startDate: new Date("2021-09-15"),
    endDate: new Date("2022-02-28"),
    industry: "Technology",
    type: "PMI",
    tools: ["altus"],
    description: "Tech company merger integration support."
  },
  {
    id: "p8",
    name: "Project Theta",
    startDate: new Date("2023-03-01"),
    endDate: new Date("2023-07-31"),
    industry: "Financial Services",
    type: "Org DD",
    tools: ["modas"],
    description: "Due diligence for fintech acquisition."
  },
  {
    id: "p9",
    name: "Project Iota",
    startDate: new Date("2023-06-15"),
    endDate: new Date("2023-10-15"),
    industry: "Healthcare",
    type: "Align and activate",
    tools: ["altus", "modas"],
    description: "Department alignment for healthcare organization."
  },
  {
    id: "p10",
    name: "Project Kappa",
    startDate: new Date("2023-09-01"),
    endDate: new Date("2024-01-31"),
    industry: "Education",
    type: "TOM implementation",
    tools: ["none"],
    description: "New operating model for educational institution."
  },
  {
    id: "p11",
    name: "Project Lambda",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-05-15"),
    industry: "Telecommunications",
    type: "Right-sizing",
    tools: ["modas"],
    description: "Team structure optimization for telecom company."
  },
  {
    id: "p12",
    name: "Project Mu",
    startDate: new Date("2023-11-01"),
    endDate: new Date("2024-03-31"),
    industry: "Manufacturing",
    type: "PMI",
    tools: ["altus"],
    description: "Post-acquisition integration for manufacturer."
  },
  {
    id: "p13",
    name: "Project Nu",
    startDate: new Date("2024-03-01"),
    endDate: new Date("2024-06-30"),
    industry: "Retail",
    type: "Align and activate",
    tools: ["altus", "modas"],
    description: "Department alignment for retail corporation."
  },
  {
    id: "p14",
    name: "Project Xi",
    startDate: new Date("2022-11-15"),
    endDate: new Date("2023-03-15"),
    industry: "Technology",
    type: "Org DD",
    tools: ["modas"],
    description: "Due diligence for tech startup acquisition."
  },
  {
    id: "p15",
    name: "Project Omicron",
    startDate: new Date("2021-12-01"),
    endDate: new Date("2022-05-31"),
    industry: "Financial Services",
    type: "TOM implementation",
    tools: ["altus"],
    description: "Operating model implementation for financial firm."
  }
];

// Generate team members
export const teamMembers: TeamMember[] = [
  {
    id: "tm1",
    name: "Alex Morgan",
    jobTitle: "Senior Consultant",
    location: "London",
    email: "alex.morgan@example.com",
    avatar: "/placeholder.svg",
    bio: "Experienced consultant specializing in organizational transformation and post-merger integration.",
    projectIds: ["p1", "p3", "p5", "p7", "p9", "p13", "p15"]
  },
  {
    id: "tm2",
    name: "Sam Taylor",
    jobTitle: "Principal",
    location: "Zurich",
    email: "sam.taylor@example.com",
    avatar: "/placeholder.svg",
    bio: "Strategy expert with focus on right-sizing and due diligence across multiple industries.",
    projectIds: ["p2", "p4", "p6", "p8", "p10", "p12", "p14"]
  },
  {
    id: "tm3",
    name: "Jordan Riley",
    jobTitle: "Associate",
    location: "New York",
    email: "jordan.riley@example.com",
    avatar: "/placeholder.svg",
    bio: "Specializes in data-driven approaches to organizational design and TOM implementation.",
    projectIds: ["p3", "p5", "p8", "p9", "p11", "p13"]
  },
  {
    id: "tm4",
    name: "Casey Kim",
    jobTitle: "Managing Director",
    location: "Singapore",
    email: "casey.kim@example.com",
    avatar: "/placeholder.svg",
    bio: "Over 15 years of experience in organizational consulting across APAC region.",
    projectIds: ["p1", "p2", "p4", "p7", "p10", "p12", "p15"]
  }
];

// Helper function to get projects for a team member
export const getProjectsForTeamMember = (teamMemberId: string): Project[] => {
  const member = teamMembers.find(tm => tm.id === teamMemberId);
  if (!member) return [];
  
  return projects.filter(project => member.projectIds.includes(project.id));
};
