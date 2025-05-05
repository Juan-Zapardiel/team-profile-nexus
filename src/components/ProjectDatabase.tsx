import { useState, useMemo } from "react";
import { Project, HumaticaTool } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, getIndustryColor, getProjectTypeColor, getToolColor } from "@/lib/utils";
import { Plus } from "lucide-react";
import { ProjectFilters } from "./ProjectFilters";

interface ProjectDatabaseProps {
  projects: Project[];
  onAddProject?: () => void;
}

export function ProjectDatabase({ projects, onAddProject }: ProjectDatabaseProps) {
  const [filters, setFilters] = useState({
    search: "",
    industries: [] as string[],
    types: [] as string[],
    tools: [] as HumaticaTool[],
    years: [] as string[],
  });

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Search filter
      if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Industry filter
      if (filters.industries.length > 0 && !filters.industries.includes(project.industry)) {
        return false;
      }

      // Type filter
      if (filters.types.length > 0 && !filters.types.includes(project.type)) {
        return false;
      }

      // Tool filter
      if (filters.tools.length > 0 && !filters.tools.some(tool => project.tools.includes(tool))) {
        return false;
      }

      // Year filter
      if (filters.years.length > 0) {
        const projectYear = new Date(project.startDate).getFullYear().toString();
        if (!filters.years.includes(projectYear)) {
          return false;
        }
      }

      return true;
    });
  }, [projects, filters]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Project Database</h2>
      
      <ProjectFilters 
        projects={projects}
        onFilterChange={setFilters}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card 
          className="overflow-hidden border-dashed border-2 hover:border-primary/50 cursor-pointer transition-colors min-h-[200px] flex items-center justify-center"
          onClick={onAddProject}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Plus className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-lg font-medium text-muted-foreground">Add New Project</p>
          </CardContent>
        </Card>

        {filteredProjects.map((project) => (
          <Card key={project.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-lg">{project.name}</h3>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(project.startDate)} - {formatDate(project.endDate)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Badge className={`${getIndustryColor(project.industry)}`}>
                    {project.industry}
                  </Badge>
                  <Badge className={`${getProjectTypeColor(project.type)}`}>
                    {project.type}
                  </Badge>
                  {project.tools.filter(tool => tool !== "none").map(tool => (
                    <Badge key={tool} className={`${getToolColor(tool)}`}>
                      {tool}
                    </Badge>
                  ))}
                </div>
                
                {project.description && (
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 