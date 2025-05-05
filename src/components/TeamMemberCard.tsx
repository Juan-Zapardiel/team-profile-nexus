import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamMember } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { calculateExperienceMetrics, getMonthsBetween, getIndustryColor, getProjectTypeColor } from "@/lib/utils";
import { Project } from "@/types";

interface TeamMemberCardProps {
  member: TeamMember;
  projects: Project[];
}

export function TeamMemberCard({ member, projects }: TeamMemberCardProps) {
  const metrics = calculateExperienceMetrics(projects);
  const initials = member.name.split(' ').map(n => n[0]).join('');
  const totalExperience = member.startDate 
    ? getMonthsBetween(new Date(member.startDate), new Date())
    : metrics.totalMonths;

  // Get project type badges
  const projectTypeBadges = Object.entries(metrics.byType)
    .filter(([_, data]) => data.projects > 0)
    .map(([type, data]) => {
      let badgeColor = "bg-gray-500";
      if (data.projects >= 5) {
        badgeColor = "bg-yellow-500";
      } else if (data.projects >= 3) {
        badgeColor = "bg-gray-300";
      } else if (data.projects >= 1) {
        badgeColor = "bg-amber-700";
      }
      return { type, count: data.projects, color: badgeColor };
    });

  // Get tool experience
  const toolExperience = Object.entries(metrics.byTool)
    .filter(([tool, data]) => tool !== "none" && data.projects > 0)
    .map(([tool, data]) => ({ tool, projects: data.projects, months: data.months }));

  // Get top industries
  const topIndustries = Object.entries(metrics.byIndustry)
    .filter(([_, data]) => data.projects > 0)
    .sort((a, b) => b[1].projects - a[1].projects)
    .slice(0, 3);
  
  return (
    <Link to={`/profile/${member.id}`} className="block transition-all hover:scale-[1.02]">
      <Card className="h-full overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{member.name}</CardTitle>
              <CardDescription>{member.jobTitle}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            {member.location}
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Projects</span>
              <span className="font-medium">{metrics.totalProjects}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tenure</span>
              <span className="font-medium">{totalExperience} months</span>
            </div>
          </div>

          {/* Project Type Badges */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Project Types</h4>
            <div className="flex flex-wrap gap-2">
              {projectTypeBadges.map(({ type, count, color }) => (
                <Badge key={type} className={color}>
                  {type} ({count})
                </Badge>
              ))}
            </div>
          </div>

          {/* Tool Experience */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Tools</h4>
            <div className="flex flex-wrap gap-2">
              {toolExperience.map(({ tool, projects }) => (
                <Badge key={tool} variant="outline">
                  {tool} ({projects})
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 pt-2 border-t">
          {topIndustries.map(([industry]) => (
            <Badge 
              key={industry} 
              variant="secondary" 
              className="text-xs"
              style={{ backgroundColor: getIndustryColor(industry as any) }}
            >
              {industry}
            </Badge>
          ))}
          {Object.entries(metrics.byIndustry).filter(([_, data]) => data.projects > 0).length > 3 && (
            <Badge variant="outline" className="text-xs">+more</Badge>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
