import { supabase } from "@/integrations/supabase/client";
import { Industry, ProjectType, HumaticaTool } from "@/types";

// Mock data with the specified team members and 30 projects
const generateProjects = (count: number = 30) => {
  const industries: Industry[] = [
    "Technology", "Healthcare", "Financial Services", "Manufacturing", 
    "Retail", "Energy", "Education", "Telecommunications", "Other"
  ];
  
  const projectTypes: ProjectType[] = [
    "Align and activate", "Right-sizing", "PMI", 
    "Org DD", "TOM implementation", "Other"
  ];
  
  const tools: HumaticaTool[] = ["altus", "modas", "none"];
  
  const projects = [];
  
  for (let i = 1; i <= count; i++) {
    // Generate random dates within the last 5 years
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() - Math.floor(Math.random() * 6)); // End date within last 6 months
    
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12) - 1); // Project duration 1-12 months
    
    const industry = industries[Math.floor(Math.random() * industries.length)];
    const type = projectTypes[Math.floor(Math.random() * projectTypes.length)];
    
    // Randomly select 1-2 tools or none
    const projectTools = [];
    const toolCount = Math.floor(Math.random() * 3); // 0, 1, or 2 tools
    
    if (toolCount > 0) {
      const shuffledTools = [...tools.filter(t => t !== "none")].sort(() => 0.5 - Math.random());
      for (let j = 0; j < toolCount && j < 2; j++) {
        projectTools.push(shuffledTools[j]);
      }
    } else {
      projectTools.push("none");
    }
    
    projects.push({
      name: `Project ${String.fromCharCode(65 + (i-1) % 26)}${Math.floor((i-1)/26) > 0 ? Math.floor((i-1)/26) : ''}`,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      industry,
      type,
      tools: projectTools,
      description: `This is a ${type.toLowerCase()} project in the ${industry.toLowerCase()} industry.`
    });
  }
  
  return projects;
};

// Profile data with the specified team members
const profilesData = [
  {
    name: "Juan Zapardiel",
    job_title: "Consultant B",
    location: "London",
    email: "jzapmes4@gmail.com", // Updated to match your email
    avatar: "/placeholder.svg",
    bio: "Experienced consultant specializing in organizational transformation with 32 months of experience."
  },
  {
    name: "Edward Kardouss",
    job_title: "Manager B",
    location: "London",
    email: "edward.kardouss@example.com",
    avatar: "/placeholder.svg",
    bio: "Strategy expert with 4 months of experience focusing on right-sizing and due diligence."
  },
  {
    name: "Oscar Herrera",
    job_title: "Senior Consultant B",
    location: "Zurich",
    email: "oscar.herrera@example.com",
    avatar: "/placeholder.svg",
    bio: "Data-driven consultant with 50 months of experience specializing in organizational design."
  },
  {
    name: "Matthias Schubert",
    job_title: "Senior Consultant A",
    location: "Munich",
    email: "matthias.schubert@example.com",
    avatar: "/placeholder.svg",
    bio: "Organizational consultant with 6 months of experience across multiple industries."
  }
];

// Function to seed the database
export const seedDatabase = async () => {
  try {
    // 1. Generate project data
    const projectsData = generateProjects(30);
    
    // 2. Insert projects
    const { data: insertedProjects, error: projectsError } = await supabase
      .from('projects')
      .insert(projectsData)
      .select();
      
    if (projectsError) {
      console.error("Error inserting projects:", projectsError);
      throw projectsError;
    }
    console.log(`Inserted ${insertedProjects?.length || 0} projects`);
    
    // 3. Create or update profiles
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("No authenticated user found");
      throw new Error("No authenticated user found");
    }

    // First, ensure all profiles exist
    for (const profileData of profilesData) {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', profileData.email)
        .single();

      if (!existingProfile) {
        // For the current user, use their auth ID
        if (profileData.email === user.email) {
          const { error: createError } = await supabase
            .from('profiles')
            .insert([{
              ...profileData,
              id: user.id,
              avatar: profileData.avatar || '/placeholder.svg'
            }]);

          if (createError) {
            console.error(`Error creating profile for ${profileData.email}:`, createError);
          }
        } else {
          // For other team members, create a profile with a deterministic ID
          const deterministicId = `team-member-${profileData.email.replace(/[^a-zA-Z0-9]/g, '')}`;
          const { error: createError } = await supabase
            .from('profiles')
            .insert([{
              ...profileData,
              id: deterministicId,
              avatar: profileData.avatar || '/placeholder.svg'
            }]);

          if (createError) {
            console.error(`Error creating profile for ${profileData.email}:`, createError);
          }
        }
      }
    }

    // 4. Get all profiles after creation/update
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
      
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }
    
    if (!allProfiles || allProfiles.length === 0) {
      throw new Error("No profiles found after creation");
    }

    // 5. Distribute projects among team members
    const juanProfile = allProfiles.find(p => p.name === "Juan Zapardiel");
    const edwardProfile = allProfiles.find(p => p.name === "Edward Kardouss");
    const oscarProfile = allProfiles.find(p => p.name === "Oscar Herrera");
    const matthiasProfile = allProfiles.find(p => p.name === "Matthias Schubert");

    // Helper function to create team_member_projects entries
    const createTeamMemberProjects = async (profileId: string, projects: any[]) => {
      if (!profileId || !projects.length) return;
      
      // First delete any existing connections for this profile
      const { error: deleteError } = await supabase
        .from('team_member_projects')
        .delete()
        .eq('profile_id', profileId);
      
      if (deleteError) {
        console.error(`Error deleting existing projects for profile ${profileId}:`, deleteError);
        return;
      }
      
      const teamMemberProjects = projects.map(project => ({
        profile_id: profileId,
        project_id: project.id
      }));
      
      if (teamMemberProjects.length > 0) {
        const { error } = await supabase
          .from('team_member_projects')
          .insert(teamMemberProjects);
          
        if (error) {
          console.error(`Error assigning projects to profile ${profileId}:`, error);
        }
      }
    };

    // Assign projects to each team member
    if (juanProfile) await createTeamMemberProjects(juanProfile.id, insertedProjects?.slice(0, 13) || []);
    if (edwardProfile) await createTeamMemberProjects(edwardProfile.id, insertedProjects?.slice(13, 15) || []);
    if (oscarProfile) await createTeamMemberProjects(oscarProfile.id, insertedProjects?.slice(15, 28) || []);
    if (matthiasProfile) await createTeamMemberProjects(matthiasProfile.id, insertedProjects?.slice(28, 30) || []);
    
    return { success: true, message: "Database seeded successfully" };
  } catch (error: any) {
    console.error("Error seeding database:", error);
    return { 
      success: false, 
      error: error.message || "Unknown error occurred during seeding" 
    };
  }
};

// Helper function to create a user with a specific profile
export const createUserWithProfile = async (email: string, password: string, profileData: any) => {
  try {
    // 1. Create the user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: profileData.name,
          job_title: profileData.job_title,
          location: profileData.location
        }
      }
    });
    
    if (authError) throw authError;
    
    // 2. Update the profile with additional data
    if (authData && authData.user) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          bio: profileData.bio
        })
        .eq('id', authData.user.id);
        
      if (updateError) throw updateError;
    }
    
    return { success: true, userId: authData?.user?.id };
  } catch (error) {
    console.error("Error creating user with profile:", error);
    return { success: false, error };
  }
};
