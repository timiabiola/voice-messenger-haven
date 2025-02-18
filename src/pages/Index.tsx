
import { useNavigate } from 'react-router-dom';
import GridLayout from '@/components/layout/GridLayout';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { ShieldCheck, MessageSquare, Bookmark, Phone, Pencil } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAdmin();

  return (
    <GridLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Welcome to the App</h1>
          {isAdmin && !isLoading && (
            <Button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2"
              variant="outline"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Dashboard
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            onClick={() => navigate('/notes')}
            className="flex items-center gap-2 h-auto p-4"
            variant="outline"
          >
            <Pencil className="w-4 h-4" />
            <div className="text-left">
              <div className="font-semibold">Notes</div>
              <p className="text-sm text-muted-foreground">Create and manage your notes</p>
            </div>
          </Button>

          <Button
            onClick={() => navigate('/saved')}
            className="flex items-center gap-2 h-auto p-4"
            variant="outline"
          >
            <Bookmark className="w-4 h-4" />
            <div className="text-left">
              <div className="font-semibold">Saved Items</div>
              <p className="text-sm text-muted-foreground">Access your saved content</p>
            </div>
          </Button>

          <Button
            onClick={() => navigate('/contacts')}
            className="flex items-center gap-2 h-auto p-4"
            variant="outline"
          >
            <Phone className="w-4 h-4" />
            <div className="text-left">
              <div className="font-semibold">Contacts</div>
              <p className="text-sm text-muted-foreground">Manage your contacts</p>
            </div>
          </Button>

          <Button
            onClick={() => navigate('/inbox-0')}
            className="flex items-center gap-2 h-auto p-4"
            variant="outline"
          >
            <MessageSquare className="w-4 h-4" />
            <div className="text-left">
              <div className="font-semibold">Messages</div>
              <p className="text-sm text-muted-foreground">View your messages</p>
            </div>
          </Button>
        </div>
      </div>
    </GridLayout>
  );
}
