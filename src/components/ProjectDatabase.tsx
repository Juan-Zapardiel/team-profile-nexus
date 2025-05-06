import { useState, useMemo } from "react";
import { Project, HumaticaTool } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, getIndustryColor, getProjectTypeColor, getToolColor } from "@/lib/utils";
import { Plus, Users, Clock } from "lucide-react";
import { ProjectFilters } from "./ProjectFilters";
import { useHarvest } from "@/hooks/useHarvest";

interface ProjectDatabaseProps {
  projects: Project[];
  onAddProject?: () => void;
}

export function ProjectDatabase({ projects: initialProjects, onAddProject }: ProjectDatabaseProps) {
  const { projects: harvestProjects, loading, error } = useHarvest();
  const [filters, setFilters] = useState({
    search: "",
    industries: [] as string[],
    types: [] as string[],
    tools: [] as HumaticaTool[],
    years: [] as string[],
  });

  // Merge initial projects with Harvest projects
  const allProjects = useMemo(() => {
    const harvestProjectIds = new Set(harvestProjects.map(p => p.id));
    const uniqueInitialProjects = initialProjects.filter(p => !harvestProjectIds.has(p.id));
    return [...harvestProjects, ...uniqueInitialProjects];
  }, [initialProjects, harvestProjects]);

  const filteredProjects = useMemo(() => {
    return allProjects.filter(project => {
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
  }, [allProjects, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Project Database</h2>
        {onAddProject && (
          <button
            onClick={onAddProject}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Project
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
          <p className="font-medium">Error loading Harvest data:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <ProjectFilters projects={allProjects} onFilterChange={setFilters} />

      <div className="grid gap-6 mt-6">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No projects found. {error ? "Harvest integration is not available." : "Try adjusting your filters."}
          </div>
        ) : (
          filteredProjects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className={getIndustryColor(project.industry)}>
                      {project.industry}
                    </Badge>
                    <Badge variant="outline" className={getProjectTypeColor(project.type)}>
                      {project.type}
                    </Badge>
                    {project.tools.map((tool) => (
                      <Badge key={tool} variant="outline" className={getToolColor(tool)}>
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {project.teamMembers && project.teamMembers.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{project.teamMembers.length} members</span>
                    </div>
                  )}
                  {project.totalHours && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{project.totalHours.toFixed(1)} hours</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>Duration: {formatDate(project.startDate)} - {formatDate(project.endDate)}</p>
                  {project.description && <p className="mt-2">{project.description}</p>}
                  {project.teamMembers && project.teamMembers.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium mb-2">Team Members:</p>
                      <div className="flex flex-wrap gap-2">
                        {project.teamMembers.map((member) => (
                          <Badge key={member} variant="secondary">
                            {member}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 