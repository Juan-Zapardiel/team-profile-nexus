import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { TeamMemberCard } from "@/components/TeamMemberCard";
import { NavBar } from "@/components/NavBar";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Project } from "@/types";
import { SeedButton } from "@/components/SeedButton";
import { useAuth } from "@/context/AuthContext";
import { ProjectDatabase } from "@/components/ProjectDatabase";
import { useNavigate } from "react-router-dom";

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

const Index = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projectsMap, setProjectsMap] = useState<Record<string, Project[]>>({});
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectCount, setProjectCount] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view team data",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      // Fetch all profiles - no filtering, this will show all team members
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch all project connections
      const { data: teammemberProjects, error: teammemberProjectsError } = await supabase
        .from('team_member_projects')
        .select('*');

      if (teammemberProjectsError) throw teammemberProjectsError;

      // Fetch all projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('start_date', { ascending: false });

      if (projectsError) throw projectsError;

      // Convert the projects and organize them by profile
      const projectsByProfile: Record<string, Project[]> = {};
      
      if (teammemberProjects && projectsData) {
        teammemberProjects.forEach((connection: TeamMemberProject) => {
          const project = projectsData.find(p => p.id === connection.project_id);
          if (project) {
            if (!projectsByProfile[connection.profile_id]) {
              projectsByProfile[connection.profile_id] = [];
            }
            projectsByProfile[connection.profile_id].push(convertToProjectType(project));
          }
        });
      }

      // Convert all projects
      const convertedProjects = projectsData?.map(convertToProjectType) || [];
      setAllProjects(convertedProjects);

      setProfiles(profilesData || []);
      setProjectsMap(projectsByProfile);
      setProjectCount(projectsData?.length || 0);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [toast]);

  const handleAddProject = () => {
    navigate("/add-project");
  };

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

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-10 max-w-7xl">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Humatica Experience Tracker</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Explore our team's experiences, projects, and skills across various industries and project types.
          </p>
          
          {projectCount === 0 && (
            <div className="mt-6 flex justify-center">
              <SeedButton onComplete={fetchData} />
            </div>
          )}
        </header>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Team Members</h2>
          {profiles.length === 0 ? (
            <p className="text-center text-muted-foreground">No team members found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {profiles.map((profile) => (
                <TeamMemberCard 
                  key={profile.id} 
                  member={{
                    id: profile.id,
                    name: profile.name,
                    jobTitle: profile.job_title,
                    location: profile.location,
                    email: profile.email,
                    avatar: profile.avatar || '/placeholder.svg',
                    bio: profile.bio,
                    projectIds: [],
                    startDate: profile.start_date || undefined,
                  }}
                  projects={projectsMap[profile.id] || []}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <ProjectDatabase 
            projects={allProjects} 
            onAddProject={handleAddProject}
            onRefresh={fetchData}
          />
        </section>
      </div>
    </div>
  );
};

export default Index;
