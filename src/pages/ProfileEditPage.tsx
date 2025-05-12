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
import { Loader2, Save, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Project, Industry, ProjectType } from "@/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getMonthsBetween } from "@/lib/utils";
import { getUsers, getUserFirstTimeEntryDate, getUserTimeEntries } from "@/integrations/harvest/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Profile = Tables<"profiles">;
type ProjectResponse = Tables<"projects">;

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

const ProfileEditPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [userProjects, setUserProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        if (!user) {
          toast({
            title: "Authentication required",
            description: "Please sign in to edit your profile",
            variant: "destructive"
          });
          navigate('/login');
          return;
        }

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
  }, [user, toast, navigate]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    // Add check to ensure user is editing their own profile
    if (profile.id !== user.id) {
      toast({
        title: "Unauthorized",
        description: "You can only edit your own profile",
        variant: "destructive"
      });
      return;
    }

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

  const handleDeleteProfile = async () => {
    if (!user) return;

    try {
      // Delete team member projects first
      const { error: projectsError } = await supabase
        .from("team_member_projects")
        .delete()
        .eq("profile_id", user.id);

      if (projectsError) throw projectsError;

      // Delete the profile
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Sign out the user
      await supabase.auth.signOut();

      toast({
        title: "Profile deleted",
        description: "Your profile has been successfully deleted.",
      });

      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error deleting profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleHarvestSync = async () => {
    if (!user || !profile) return;
    
    setSyncing(true);
    try {
      // Get all Harvest users to find the matching one
      const harvestUsers = await getUsers();
      const harvestUser = harvestUsers.find(h => h.email.toLowerCase() === user.email?.toLowerCase());
      
      if (!harvestUser) {
        throw new Error("No matching Harvest user found for your email");
      }

      // Get the first time entry date
      const firstTimeEntryDate = await getUserFirstTimeEntryDate(harvestUser.id);
      
      if (!firstTimeEntryDate) {
        throw new Error("No time entries found in Harvest");
      }

      // Get all time entries for the user
      const timeEntries = await getUserTimeEntries(harvestUser.id);
      
      // Get all projects from our database
      const { data: dbProjects, error: projectsError } = await supabase
        .from("projects")
        .select("*");

      if (projectsError) throw projectsError;

      // Get current user projects
      const { data: currentUserProjects, error: currentProjectsError } = await supabase
        .from("team_member_projects")
        .select("project_id")
        .eq("profile_id", user.id);

      if (currentProjectsError) throw currentProjectsError;

      const currentProjectIds = currentUserProjects.map(p => p.project_id);

      // Calculate days worked for each project
      const projectDaysWorked = new Map<string, number>();
      
      // First, initialize all current projects with 0 days
      currentProjectIds.forEach(projectId => {
        projectDaysWorked.set(projectId, 0);
      });

      // Then calculate days worked for projects with time entries
      dbProjects.forEach(dbProject => {
        const projectEntries = timeEntries.filter(entry => 
          entry.project.name.toLowerCase() === dbProject.name.toLowerCase()
        );
        
        if (projectEntries.length > 0) {
          // Get unique dates for this project
          const uniqueDates = new Set(projectEntries.map(entry => entry.spent_date));
          projectDaysWorked.set(dbProject.id, uniqueDates.size);
        }
      });

      // Find matching projects by name (since Harvest and our DB use different IDs)
      const matchingProjects = dbProjects.filter(dbProject => 
        timeEntries.some(entry => 
          entry.project.name.toLowerCase() === dbProject.name.toLowerCase()
        )
      );

      // Add new project associations and update days worked
      const newProjectIds = matchingProjects
        .map(p => p.id)
        .filter(id => !currentProjectIds.includes(id));

      // Prepare batch operations for new and existing projects
      const operations = [];

      // Add new project associations
      if (newProjectIds.length > 0) {
        operations.push(
          supabase
            .from("team_member_projects")
            .insert(
              newProjectIds.map(projectId => ({
                profile_id: user.id,
                project_id: projectId,
                days_worked: projectDaysWorked.get(projectId) || 0
              }))
            )
        );
      }

      // Update days worked for all existing projects
      if (currentProjectIds.length > 0) {
        // Update each project's days worked individually
        for (const projectId of currentProjectIds) {
          operations.push(
            supabase
              .from("team_member_projects")
              .update({ days_worked: projectDaysWorked.get(projectId) || 0 })
              .eq("profile_id", user.id)
              .eq("project_id", projectId)
          );
        }
      }

      // Execute all operations
      await Promise.all(operations);

      // Update the profile with the start date
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          start_date: firstTimeEntryDate
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile(prev => prev ? { ...prev, start_date: firstTimeEntryDate } : null);

      // Reload user projects
      const updatedUserProjects = [...userProjects];
      for (const projectId of newProjectIds) {
        const project = dbProjects.find(p => p.id === projectId);
        if (project) {
          updatedUserProjects.push({
            id: project.id,
            name: project.name,
            startDate: new Date(project.start_date),
            endDate: new Date(project.end_date),
            industry: project.industry as Industry,
            type: project.type as ProjectType,
            tools: project.tools as any[],
            description: project.description || undefined,
            daysWorked: projectDaysWorked.get(project.id) || 0
          });
        }
      }
      setUserProjects(updatedUserProjects);

      toast({
        title: "Harvest sync successful",
        description: `Your start date has been updated and ${newProjectIds.length} new projects have been added to your profile. Days worked have been updated for all projects.`,
      });
    } catch (error: any) {
      toast({
        title: "Harvest sync failed",
        description: error.message || "Failed to sync with Harvest",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
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
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Edit Your Profile</h1>
            <Button
              onClick={handleHarvestSync}
              disabled={syncing}
              variant="default"
              size="sm"
            >
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync with Harvest
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4 mb-6">
                  <Avatar 
                    className="h-20 w-20 [&>span]:bg-[var(--avatar-bg)]" 
                    style={getAvatarColor(profile.name)}
                  >
                    <AvatarFallback className="text-xl text-black">
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
                    readOnly
                    disabled
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    readOnly
                    disabled
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

            <Card className="mt-8 border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Once you delete your profile, there is no going back. Please be certain.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Profile
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your profile
                        and remove all associated data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteProfile}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Profile
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;
