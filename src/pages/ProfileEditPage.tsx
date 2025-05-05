import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Project, Industry, ProjectType } from "@/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getMonthsBetween } from "@/lib/utils";

type Profile = Tables<"profiles">;
type ProjectResponse = Tables<"projects">;

const ProfileEditPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [userProjects, setUserProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        setProfile(profileData);

        // Fetch all projects
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("*")
          .order("name");

        if (projectsError) {
          throw projectsError;
        }

        // Convert projects
        const formattedProjects = projectsData.map((project: ProjectResponse) => ({
          id: project.id,
          name: project.name,
          startDate: new Date(project.start_date),
          endDate: new Date(project.end_date),
          industry: project.industry as Industry,
          type: project.type as ProjectType,
          tools: project.tools as any[],
          description: project.description || undefined,
        }));

        setAllProjects(formattedProjects);

        // Fetch user's projects
        const { data: userProjectLinks, error: userProjectsError } = await supabase
          .from("team_member_projects")
          .select("project_id")
          .eq("profile_id", user.id);

        if (userProjectsError) {
          throw userProjectsError;
        }

        const userProjectIds = userProjectLinks.map(link => link.project_id);
        const userProjectsList = formattedProjects.filter(
          project => userProjectIds.includes(project.id as string)
        );

        setUserProjects(userProjectsList);
      } catch (error: any) {
        console.error("Error loading profile:", error.message);
        toast({
          title: "Error loading profile",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, toast]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          job_title: profile.job_title,
          location: profile.location,
          bio: profile.bio,
          start_date: profile.start_date,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleProjectToggle = async (projectId: string) => {
    if (!user) return;

    // Check if the project is already assigned to the user
    const isAssigned = userProjects.some(p => p.id === projectId);

    try {
      if (isAssigned) {
        // Remove the project
        await supabase
          .from("team_member_projects")
          .delete()
          .eq("profile_id", user.id)
          .eq("project_id", projectId);

        setUserProjects(userProjects.filter(p => p.id !== projectId));
      } else {
        // Add the project
        await supabase
          .from("team_member_projects")
          .insert({ profile_id: user.id, project_id: projectId });

        const projectToAdd = allProjects.find(p => p.id === projectId);
        if (projectToAdd) {
          setUserProjects([...userProjects, projectToAdd]);
        }
      }

      toast({
        title: isAssigned ? "Project removed" : "Project added",
        description: `Project has been ${isAssigned ? "removed from" : "added to"} your profile.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating projects",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
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
        <div className="container py-10">
          <Card>
            <CardHeader>
              <CardTitle>Profile Not Found</CardTitle>
              <CardDescription>
                We couldn't find your profile information.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate("/")}>Back to Home</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Edit Your Profile</h1>

          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and profile information
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleProfileUpdate}>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4 mb-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile.avatar || '/placeholder.svg'} alt={profile.name} />
                      <AvatarFallback>
                        {profile.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{profile.email}</h3>
                      <p className="text-sm text-muted-foreground">
                        Profile picture currently can't be changed
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={profile.job_title}
                      onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio || ''}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell us about yourself and your expertise..."
                      rows={4}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={profile.start_date || ''}
                      onChange={(e) => setProfile({ ...profile, start_date: e.target.value })}
                    />
                    {profile.start_date && (
                      <p className="text-sm text-muted-foreground">
                        Experience: {getMonthsBetween(new Date(profile.start_date), new Date())} months
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
                <CardDescription>
                  Manage the projects you have worked on
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Your Projects ({userProjects.length})</h3>
                  {userProjects.length > 0 ? (
                    <ul className="space-y-2">
                      {userProjects.map(project => (
                        <li key={project.id} className="flex items-center justify-between p-2 border rounded-md">
                          <div>
                            <p className="font-medium">{project.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {project.industry} • {project.type}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleProjectToggle(project.id as string)}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">You have not been assigned to any projects yet.</p>
                  )}

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="w-full mt-4">
                        Add Projects
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Available Projects</SheetTitle>
                        <SheetDescription>
                          Select projects you have worked on to add them to your profile.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6 space-y-2">
                        {allProjects.map(project => {
                          const isAssigned = userProjects.some(p => p.id === project.id);
                          return (
                            <div key={project.id} className="flex items-center justify-between p-2 border rounded-md">
                              <div>
                                <p className="font-medium">{project.name}</p>
                                <div className="text-sm text-muted-foreground">
                                  <p>{project.industry} • {project.type}</p>
                                  <p>
                                    {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Button 
                                variant={isAssigned ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleProjectToggle(project.id as string)}
                              >
                                {isAssigned ? "Remove" : "Add"}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;
