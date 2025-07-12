import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Phone, Mail, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import type { NotificationPreference } from '@/types/notifications';

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Notification settings state
  const [notificationPreference, setNotificationPreference] = useState<NotificationPreference>('sms');
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  
  // User profile state
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profile) {
        setPhone(profile.phone || '');
        setEmail(profile.email || '');
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setNotificationPreference(profile.notification_preference || 'sms');
        setSmsEnabled(profile.sms_notifications_enabled ?? true);
        setEmailEnabled(profile.email_notifications_enabled ?? true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate based on notification preference
      if ((notificationPreference === 'sms' || notificationPreference === 'both') && !phone) {
        toast.error('Please add a phone number to receive SMS notifications');
        setSaving(false);
        return;
      }

      if ((notificationPreference === 'email' || notificationPreference === 'both') && !email) {
        toast.error('Please add an email address to receive email notifications');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          phone,
          email,
          first_name: firstName,
          last_name: lastName,
          notification_preference: notificationPreference,
          sms_notifications_enabled: smsEnabled,
          email_notifications_enabled: emailEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const isMobile = window.innerWidth < 768;

  const content = (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-4 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-accent rounded-full"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-20 md:pb-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="john.doe@example.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about new voice messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Notification Method</Label>
                <RadioGroup value={notificationPreference} onValueChange={(value) => setNotificationPreference(value as NotificationPreference)}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
                    <RadioGroupItem value="sms" id="sms" />
                    <Label htmlFor="sms" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>SMS Text Message</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Get instant notifications via text message</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
                    <RadioGroupItem value="email" id="email-opt" />
                    <Label htmlFor="email-opt" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Receive notifications in your email inbox</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <Mail className="w-4 h-4" />
                        <span>Both SMS & Email</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Get notified via both channels</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none" className="flex-1 cursor-pointer">
                      <span>No Notifications</span>
                      <p className="text-sm text-muted-foreground">Don't send any notifications</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sms-toggle">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable SMS notifications
                    </p>
                  </div>
                  <Switch
                    id="sms-toggle"
                    checked={smsEnabled}
                    onCheckedChange={setSmsEnabled}
                    disabled={notificationPreference === 'none'}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-toggle">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable email notifications
                    </p>
                  </div>
                  <Switch
                    id="email-toggle"
                    checked={emailEnabled}
                    onCheckedChange={setEmailEnabled}
                    disabled={notificationPreference === 'none'}
                  />
                </div>
              </div>

              {/* Warning messages */}
              {notificationPreference !== 'none' && (
                <div className="space-y-2">
                  {(notificationPreference === 'sms' || notificationPreference === 'both') && !phone && (
                    <p className="text-sm text-destructive">
                      ⚠️ Please add a phone number to receive SMS notifications
                    </p>
                  )}
                  {(notificationPreference === 'email' || notificationPreference === 'both') && !email && (
                    <p className="text-sm text-destructive">
                      ⚠️ Please add an email address to receive email notifications
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification History */}
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                View your recent notification activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Notification history will be available after the first message is sent.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );

  return isMobile ? content : <AppLayout>{content}</AppLayout>;
} 