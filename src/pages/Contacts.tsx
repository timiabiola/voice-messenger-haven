
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Star, StarOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
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
  const [defaultRecipients, setDefaultRecipients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
    fetchDefaultRecipients();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load profiles');
    }
  };

  const fetchDefaultRecipients = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('voice_message_recipients')
        .select('recipient_id')
        .eq('sender_id', session.user.id)
        .eq('is_default', true);

      if (error) throw error;
      setDefaultRecipients(data.map(r => r.recipient_id));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching default recipients:', error);
      toast.error('Failed to load default recipients');
      setIsLoading(false);
    }
  };

  const toggleDefaultRecipient = async (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click when clicking the star
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to manage default recipients');
        return;
      }

      const isDefault = defaultRecipients.includes(profileId);

      if (isDefault) {
        // Remove from default recipients
        const { error } = await supabase
          .from('voice_message_recipients')
          .delete()
          .eq('sender_id', session.user.id)
          .eq('recipient_id', profileId)
          .eq('is_default', true);

        if (error) throw error;
        setDefaultRecipients(defaultRecipients.filter(id => id !== profileId));
        toast.success('Removed from default recipients');
      } else {
        // Add to default recipients
        const { error } = await supabase
          .from('voice_message_recipients')
          .insert({
            sender_id: session.user.id,
            recipient_id: profileId,
            is_default: true
          });

        if (error) throw error;
        setDefaultRecipients([...defaultRecipients, profileId]);
        toast.success('Added to default recipients');
      }
    } catch (error) {
      console.error('Error toggling default recipient:', error);
      toast.error('Failed to update default recipients');
    }
  };

  const handleRowClick = (profile: Profile) => {
    navigate('/microphone', { 
      state: { 
        selectedProfile: {
          ...profile,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
        }
      }
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Users</h1>
        </div>

        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Default Recipient</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow 
                  key={profile.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(profile)}
                >
                  <TableCell className="font-medium">
                    {`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'No name'}
                  </TableCell>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => toggleDefaultRecipient(profile.id, e)}
                      disabled={isLoading}
                    >
                      {defaultRecipients.includes(profile.id) ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {profiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
};

export default Contacts;
