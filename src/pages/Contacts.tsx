
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { formatNameWithInitial } from '@/lib/utils';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
}

const Contacts = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name');

      if (error) throw error;
      setProfiles(data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load profiles');
      setIsLoading(false);
    }
  };

  const handleRowClick = (profile: Profile) => {
    navigate('/microphone', { 
      state: { 
        selectedProfile: {
          ...profile,
          name: formatNameWithInitial(profile.first_name, profile.last_name),
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-4rem)] w-full bg-black">
        <div className="sticky top-16 z-40 bg-black/80 backdrop-blur-sm border-b border-amber-400/20 px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-amber-400">Contacts</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        <div className="px-4 pb-20">
          <div className="mt-4 rounded-lg overflow-hidden border border-amber-400/20">
            <div className="divide-y divide-amber-400/10">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleRowClick(profile)}
                  className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-amber-400/5 active:bg-amber-400/10 transition-colors touch-manipulation"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-400 text-sm">
                      {(profile.first_name?.[0] || profile.email[0]).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="font-medium text-amber-400 truncate">
                      {formatNameWithInitial(profile.first_name, profile.last_name)}
                    </h3>
                  </div>
                </button>
              ))}
              {profiles.length === 0 && (
                <div className="px-4 py-8 text-center text-amber-400/60">
                  No contacts found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Contacts;
