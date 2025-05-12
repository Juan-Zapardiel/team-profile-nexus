import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProjectListItem } from "@/components/ProjectListItem";
import { ExperienceBadge } from "@/components/ExperienceBadge";
import { ExperienceChart } from "@/components/ExperienceChart";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { calculateExperienceMetrics, getMonthsBetween } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/components/ui/use-toast";
import { Project, Industry, ProjectType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

type Profile = Tables<"profiles">;
type ProjectResponse = Tables<"projects">;
type TeamMemberProject = Tables<"team_member_projects">;

// Helper function to convert Supabase project to our application Project type
const convertToProjectType = (project: ProjectResponse): Project => {
  return {
    id: project.id,
    name: project.name,
    startDate: new Date(project.start_date),
    endDate: new Date(project.end_date),
    industry: project.industry as any,
    type: project.type as any,
    tools: project.tools as any[],
    description: project.description || undefined
  };
};

// Function to get a color based on the team member's name
function getAvatarColor(name: string): React.CSSProperties {
  if (name === "Juan Zapardiel") {
    return { "--avatar-bg": "#F0F8FF" } as React.CSSProperties;
  }
  if (name === "Edward Kardouss") {
    return { "--avatar-bg": "#F5F5DC" } as React.CSSProperties;
  }
  return { "--avatar-bg": "#E6E6FA" } as React.CSSProperties; // Default to Lavender for others
}

const ProfilePage = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchProfileAndProjects = async () => {
      if (!memberId) return;

      try {
        if (!user) {
          toast({
            title: "Authentication required",
            description: "Please sign in to view profile data",
            variant: "destructive"
          });
          navigate('/login');
          return;
        }

        // Fetch the profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', memberId)
          .single();
          
        if (profileError) throw profileError;
        
        // Fetch projects for this profile with days worked
        const { data: teammemberProjects, error: teammemberProjectsError } = await supabase
          .from('team_member_projects')
          .select('*, projects(*)')
          .eq('profile_id', memberId);
          
        if (teammemberProjectsError) throw teammemberProjectsError;
        
        // Convert projects and include days worked
        const profileProjects: Project[] = teammemberProjects.map((tmp: any) => ({
          id: tmp.projects.id,
          name: tmp.projects.name,
          startDate: new Date(tmp.projects.start_date),
          endDate: new Date(tmp.projects.end_date),
          industry: tmp.projects.industry as Industry,
          type: tmp.projects.type as ProjectType,
          tools: tmp.projects.tools as any[],
          description: tmp.projects.description || undefined,
          daysWorked: tmp.days_worked || 0
        }));
        
        setProfile(profileData);
        setProjects(profileProjects);
      } catch (error: any) {
        toast({
          title: "Error fetching profile",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileAndProjects();
  }, [memberId, toast, navigate]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container py-10 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container py-10 text-center">
          <h1 className="text-2xl mb-4">Member not found</h1>
          <Button asChild>
            <Link to="/">Back to Team</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const metrics = calculateExperienceMetrics(projects);
  const initials = profile.name.split(' ').map(n => n[0]).join('');
  const totalExperience = profile.start_date 
    ? getMonthsBetween(new Date(profile.start_date), new Date())
    : metrics.totalMonths;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-10 max-w-7xl">
        <Link to="/" className="inline-flex items-center text-sm mb-8 hover:text-primary transition-colors">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Team
        </Link>
        
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar 
              className="h-24 w-24 [&>span]:bg-[var(--avatar-bg)]" 
              style={getAvatarColor(profile.name)}
            >
              <AvatarFallback className="text-2xl text-black">{initials}</AvatarFallback>
            </Avatar>
            
            <div className="space-y-3 flex-1">
              <h1 className="text-3xl font-bold">{profile.name}</h1>
              <div className="flex flex-col md:flex-row md:items-center gap-y-2 gap-x-6">
                <div className="text-lg text-muted-foreground">{profile.job_title}</div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  {profile.location}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                  {profile.email}
                </div>
              </div>
              {profile.bio && <p>{profile.bio}</p>}
            </div>
          </div>
        </div>
        
        {/* Experience Summary */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Experience Summary</h2>
          
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
                <div className="text-3xl font-bold">{totalExperience} <span className="text-base font-normal">months</span></div>
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

          {/* Project Type Badges */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Project Type Achievements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(metrics.byType)
                .filter(([_, data]) => data.projects > 0)
                .sort((a, b) => b[1].projects - a[1].projects)
                .map(([type, data]) => {
                  let badgeColor = "bg-amber-700";
                  let badgeText = "Bronze";
                  if (data.projects >= 5) {
                    badgeColor = "bg-yellow-500";
                    badgeText = "Gold";
                  } else if (data.projects >= 3) {
                    badgeColor = "bg-gray-300";
                    badgeText = "Silver";
                  }
                  return (
                    <Card key={type}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{type}</h4>
                            <p className="text-sm text-muted-foreground">{data.projects} projects</p>
                          </div>
                          <Badge className={`${badgeColor} text-white`}>
                            {badgeText}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ExperienceChart 
              key="industry-chart"
              metrics={metrics} 
              type="industry" 
              dataType="projects" 
            />
            <ExperienceChart 
              key="project-type-chart"
              metrics={metrics} 
              type="projectType" 
              dataType="projects" 
            />
          </div>
        </div>
        
        {/* Tool Experience */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Tool Experience</h2>
          
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
        <div>
          <h2 className="text-2xl font-semibold mb-6">Project History</h2>
          
          {projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No projects found for this team member.</p>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <ProjectListItem
                  key={project.id}
                  project={project}
                  showDaysWorked={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
