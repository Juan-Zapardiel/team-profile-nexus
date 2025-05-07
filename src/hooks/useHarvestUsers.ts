import { useState, useEffect } from 'react';

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
      const response = await fetch('http://localhost:3001/api/harvest/users');
      if (!response.ok) throw new Error('Failed to fetch Harvest users');
      const data = await response.json();
      setUsers(data.users || []);
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