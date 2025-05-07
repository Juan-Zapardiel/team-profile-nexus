import { useState, useEffect } from 'react';
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

      // Fetch projects from the backend proxy
      const response = await fetch('http://localhost:3001/api/harvest/projects');
      if (!response.ok) throw new Error('Failed to fetch projects from backend proxy');
      const data = await response.json();
      const harvestProjects = data.projects || [];

      // Convert Harvest projects to our format
      const convertedProjects = harvestProjects.map(convertHarvestProject);
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