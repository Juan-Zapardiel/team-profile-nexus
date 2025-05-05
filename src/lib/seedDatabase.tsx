
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
      
    if (projectsError) throw projectsError;
    console.log(`Inserted ${insertedProjects.length} projects`);
    
    // 3. Insert dummy profiles if they don't exist yet
    // This assumes you'll create actual users via authentication
    // For seeding, we'll just check if we need to create dummy profiles
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('*');
    
    if (!existingProfiles || existingProfiles.length === 0) {
      // Get authenticated user's ID if available
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Update the first profile (Juan Zapardiel) with the authenticated user's ID
        const { data: userProfile, error: userProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (!userProfileError && userProfile) {
          // Update the existing profile with Juan's details
          await supabase
            .from('profiles')
            .update({
              name: profilesData[0].name,
              job_title: profilesData[0].job_title,
              location: profilesData[0].location,
              bio: profilesData[0].bio
            })
            .eq('id', user.id);
        }
        
        // For the remaining profiles, create new users
        const otherProfiles = profilesData.slice(1);
        for (const profile of otherProfiles) {
          const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
            email: profile.email,
            password: 'password123', // Simple password for demo
            user_metadata: {
              name: profile.name,
              job_title: profile.job_title,
              location: profile.location
            }
          });
          
          if (createUserError) {
            console.error(`Error creating user ${profile.email}:`, createUserError);
            continue;
          }
          
          if (newUser) {
            await supabase
              .from('profiles')
              .update({ bio: profile.bio })
              .eq('id', newUser.user.id);
          }
        }
      }
    }
    
    // 4. Distribute projects among team members
    // For demonstration, we'll assign projects based on their experience months
    const { data: updatedProfiles } = await supabase
      .from('profiles')
      .select('*');
      
    if (updatedProfiles && updatedProfiles.length > 0) {
      // Juan (32 months) - assign ~13 projects
      const juanProfile = updatedProfiles.find(p => p.name === "Juan Zapardiel");
      const juanProjects = insertedProjects.slice(0, 13);
      
      // Edward (4 months) - assign ~2 projects
      const edwardProfile = updatedProfiles.find(p => p.name === "Edward Kardouss");
      const edwardProjects = insertedProjects.slice(13, 15);
      
      // Oscar (50 months) - assign ~20 projects
      const oscarProfile = updatedProfiles.find(p => p.name === "Oscar Herrera");
      const oscarProjects = insertedProjects.slice(15, 28);
      
      // Matthias (6 months) - assign ~2 projects
      const matthiasProfile = updatedProfiles.find(p => p.name === "Matthias Schubert");
      const matthiasProjects = insertedProjects.slice(28, 30);
      
      // Helper function to create team_member_projects entries
      const createTeamMemberProjects = async (profileId: string, projects: any[]) => {
        if (!profileId) return;
        
        // First delete any existing connections for this profile
        await supabase
          .from('team_member_projects')
          .delete()
          .eq('profile_id', profileId);
        
        const teamMemberProjects = projects.map(project => ({
          profile_id: profileId,
          project_id: project.id
        }));
        
        if (teamMemberProjects.length > 0) {
          const { error } = await supabase
            .from('team_member_projects')
            .insert(teamMemberProjects);
            
          if (error) throw error;
        }
      };
      
      // Assign projects to each team member
      if (juanProfile) await createTeamMemberProjects(juanProfile.id, juanProjects);
      if (edwardProfile) await createTeamMemberProjects(edwardProfile.id, edwardProjects);
      if (oscarProfile) await createTeamMemberProjects(oscarProfile.id, oscarProjects);
      if (matthiasProfile) await createTeamMemberProjects(matthiasProfile.id, matthiasProjects);
      
      console.log("Projects assigned to team members");
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error seeding database:", error);
    return { success: false, error };
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
