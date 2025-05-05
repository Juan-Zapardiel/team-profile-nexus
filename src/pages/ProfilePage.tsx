
import { useParams, Link } from "react-router-dom";
import { teamMembers, getProjectsForTeamMember } from "@/data/mockData";
import { ProjectListItem } from "@/components/ProjectListItem";
import { ExperienceBadge } from "@/components/ExperienceBadge";
import { ExperienceChart } from "@/components/ExperienceChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { calculateExperienceMetrics } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const ProfilePage = () => {
  const { memberId } = useParams<{ memberId: string }>();
  
  const member = teamMembers.find(tm => tm.id === memberId);
  if (!member) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl mb-4">Member not found</h1>
        <Button asChild>
          <Link to="/">Back to Team</Link>
        </Button>
      </div>
    );
  }
  
  const projects = getProjectsForTeamMember(member.id);
  const metrics = calculateExperienceMetrics(projects);
  const initials = member.name.split(' ').map(n => n[0]).join('');

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-10 max-w-7xl">
        <Link to="/" className="inline-flex items-center text-sm mb-8 hover:text-primary transition-colors">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Team
        </Link>
        
        {/* Profile Header */}
        <div className="profile-section">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            
            <div className="space-y-3 flex-1">
              <h1 className="text-3xl font-bold">{member.name}</h1>
              <div className="flex flex-col md:flex-row md:items-center gap-y-2 gap-x-6">
                <div className="text-lg text-muted-foreground">{member.jobTitle}</div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  {member.location}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                  {member.email}
                </div>
              </div>
              {member.bio && <p>{member.bio}</p>}
            </div>
          </div>
        </div>
        
        {/* Experience Summary */}
        <div className="profile-section">
          <h2 className="profile-section-title">Experience Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="text-muted-foreground">Total Projects</div>
                <div className="text-3xl font-bold">{metrics.totalProjects}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="text-muted-foreground">Total Experience</div>
                <div className="text-3xl font-bold">{metrics.totalMonths} <span className="text-base font-normal">months</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="text-muted-foreground">Industries</div>
                <div className="text-3xl font-bold">
                  {Object.values(metrics.byIndustry).filter(v => v.projects > 0).length}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="experience-grid">
            <ExperienceChart 
              metrics={metrics} 
              type="industry" 
              dataType="projects" 
            />
            <ExperienceChart 
              metrics={metrics} 
              type="projectType" 
              dataType="projects" 
            />
          </div>
        </div>
        
        {/* Tool Experience */}
        <div className="profile-section">
          <h2 className="profile-section-title">Tool Experience</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(metrics.byTool)
              .filter(([tool, data]) => tool !== "none" && data.projects > 0)
              .map(([tool, data]) => (
                <Card key={tool} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold capitalize">{tool}</h3>
                        <p className="text-sm text-muted-foreground">
                          {data.projects} projects / {data.months} months
                        </p>
                      </div>
                      <ExperienceBadge 
                        count={data.projects} 
                        label="projects" 
                        colorClass={`bg-${tool === "altus" ? "blue-600" : "purple-600"}`}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${tool === "altus" ? "bg-blue-600" : "bg-purple-600"}`}
                          style={{ width: `${Math.min(100, data.projects * 10)}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
        
        {/* Project History */}
        <div className="profile-section">
          <h2 className="profile-section-title">Project History</h2>
          
          <div className="space-y-6">
            {projects
              .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())
              .map((project) => (
                <ProjectListItem key={project.id} project={project} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
