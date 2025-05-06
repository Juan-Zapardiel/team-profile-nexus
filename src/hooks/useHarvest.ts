import { useState, useEffect } from 'react';
import { getHarvestClient } from '@/integrations/harvest/client';
import { convertHarvestProject, getProjectTeamMembers, getProjectTotalHours } from '@/lib/harvestUtils';
import { Project } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface UseHarvestReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
}

export const useHarvest = (): UseHarvestReturn => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      let harvest;
      try {
        harvest = getHarvestClient();
      } catch (err) {
        // If client is not initialized, return empty projects
        setProjects([]);
        setLoading(false);
        return;
      }

      const harvestProjects = await harvest.getProjects();
      
      // Get time entries for the last 12 months
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);
      const timeEntries = await harvest.getTimeEntries(
        startDate.toISOString().split('T')[0],
        endDate
      );

      // Convert Harvest projects to our format
      const convertedProjects = harvestProjects.map(harvestProject => {
        const projectTimeEntries = timeEntries.filter(
          entry => entry.project.id === harvestProject.id
        );
        
        const project = convertHarvestProject(harvestProject);
        
        // Add team members and hours information
        return {
          ...project,
          teamMembers: getProjectTeamMembers(projectTimeEntries),
          totalHours: getProjectTotalHours(projectTimeEntries)
        };
      });

      setProjects(convertedProjects);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Harvest projects';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    refreshProjects: fetchProjects
  };
}; 