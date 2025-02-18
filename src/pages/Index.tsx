
import { useNavigate } from 'react-router-dom';
import GridLayout from '@/components/layout/GridLayout';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAdmin();

  return (
    <GridLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Welcome to the App</h1>
        {isAdmin && !isLoading && (
          <Button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Admin Dashboard
          </Button>
        )}
      </div>
    </GridLayout>
  );
}
