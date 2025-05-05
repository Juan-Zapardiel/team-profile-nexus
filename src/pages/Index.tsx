
import { teamMembers, getProjectsForTeamMember } from "@/data/mockData";
import { TeamMemberCard } from "@/components/TeamMemberCard";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-10 max-w-7xl">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Team Profile Nexus</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore our team's experiences, projects, and skills across various industries and project types.
          </p>
        </header>

        <section>
          <h2 className="text-2xl font-semibold mb-6">Team Members</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <TeamMemberCard 
                key={member.id} 
                member={member} 
                projects={getProjectsForTeamMember(member.id)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
