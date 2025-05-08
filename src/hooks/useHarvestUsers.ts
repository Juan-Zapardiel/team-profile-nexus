import { useState, useEffect } from 'react';
import { getUsers } from '@/integrations/harvest/client';

export interface HarvestUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
}

interface UseHarvestUsersReturn {
  users: HarvestUser[];
  loading: boolean;
  error: string | null;
  refreshUsers: () => Promise<void>;
}

export const useHarvestUsers = (): UseHarvestUsersReturn => {
  const [users, setUsers] = useState<HarvestUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const harvestUsers = await getUsers();
      setUsers(harvestUsers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Harvest users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    refreshUsers: fetchUsers,
  };
}; 