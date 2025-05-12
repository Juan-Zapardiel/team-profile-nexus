import { Project } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

export interface ProjectListItemProps {
  project: Project;
  showDaysWorked?: boolean;
}

export const ProjectListItem = ({ project, showDaysWorked = false }: ProjectListItemProps) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{project.name}</h3>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge variant="secondary">{project.type}</Badge>
              <Badge variant="outline">{project.industry}</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
            </div>
            {showDaysWorked && project.daysWorked && (
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                <span>{project.daysWorked} days worked</span>
              </div>
            )}
          </div>

          {project.tools && project.tools.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.tools.map((tool) => (
                <Badge key={tool} variant="secondary">
                  {tool}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
