
import { useAdmin } from '@/hooks/useAdmin';
import { Navigate } from 'react-router-dom';
import SidebarLayout from '@/components/layout/SidebarLayout';
import MessageStats from '@/components/messages/MessageStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  const { isAdmin, isLoading } = useAdmin();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarLayout>
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        
        <Tabs defaultValue="delivery" className="space-y-4">
          <TabsList>
            <TabsTrigger value="delivery">Delivery Metrics</TabsTrigger>
            <TabsTrigger value="performance">System Performance</TabsTrigger>
            <TabsTrigger value="alerts">Alerts & Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="delivery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Message Delivery Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <MessageStats />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>System Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Performance metrics coming in next iteration...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>System Alerts & Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Alert history and logs coming in next iteration...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
