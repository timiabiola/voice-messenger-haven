
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

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface DefaultRecipient {
  recipient_id: string;
  sender_id: string;
}

const Contacts = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [defaultRecipients, setDefaultRecipients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
    fetchDefaultRecipients();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
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

  const toggleDefaultRecipient = async (contactId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to manage default recipients');
        return;
      }

      const isDefault = defaultRecipients.includes(contactId);

      if (isDefault) {
        // Remove from default recipients
        const { error } = await supabase
          .from('voice_message_recipients')
          .delete()
          .eq('sender_id', session.user.id)
          .eq('recipient_id', contactId)
          .eq('is_default', true);

        if (error) throw error;
        setDefaultRecipients(defaultRecipients.filter(id => id !== contactId));
        toast.success('Removed from default recipients');
      } else {
        // Add to default recipients
        const { error } = await supabase
          .from('voice_message_recipients')
          .insert({
            sender_id: session.user.id,
            recipient_id: contactId,
            is_default: true
          });

        if (error) throw error;
        setDefaultRecipients([...defaultRecipients, contactId]);
        toast.success('Added to default recipients');
      }
    } catch (error) {
      console.error('Error toggling default recipient:', error);
      toast.error('Failed to update default recipients');
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <Button onClick={() => navigate('/new-contact')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Default Recipient</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleDefaultRecipient(contact.id)}
                      disabled={isLoading}
                    >
                      {defaultRecipients.includes(contact.id) ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {contacts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No contacts found. Add your first contact to get started.
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
