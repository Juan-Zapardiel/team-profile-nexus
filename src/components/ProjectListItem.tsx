
import { formatDate, getIndustryColor, getProjectTypeColor } from "@/lib/utils";
import { Project } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ProjectListItemProps {
  project: Project;
}

export function ProjectListItem({ project }: ProjectListItemProps) {
  const duration = formatDate(project.startDate) + " - " + formatDate(project.endDate);
  const industryClass = getIndustryColor(project.industry).replace("bg-", "text-");
  const typeClass = getProjectTypeColor(project.type).replace("bg-", "text-");

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-lg">{project.name}</h3>
          <span className="text-sm text-muted-foreground whitespace-nowrap">{duration}</span>
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
              <Badge key={tool} variant="outline">
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
  );
}
