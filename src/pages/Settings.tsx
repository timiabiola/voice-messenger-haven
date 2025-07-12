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

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Profile not found, creating new profile');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            notification_preference: 'sms',
            sms_notifications_enabled: true,
            email_notifications_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        }

        if (newProfile) {
          setEmail(newProfile.email || '');
          setNotificationPreference(newProfile.notification_preference || 'sms');
          setSmsEnabled(newProfile.sms_notifications_enabled ?? true);
          setEmailEnabled(newProfile.email_notifications_enabled ?? true);
        }
      } else if (error) {
        throw error;
      } else if (profile) {
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

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      toast.success('Settings saved successfully');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      // Show more specific error message
      if (error?.message?.includes('new row violates row-level security policy')) {
        toast.error('Permission denied. Please refresh the page and try again.');
      } else if (error?.message) {
        toast.error(`Failed to save settings: ${error.message}`);
      } else {
        toast.error('Failed to save settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const isMobile = window.innerWidth < 768;

  const content = (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header - only show on mobile */}
      {isMobile && (
        <header className="sticky top-0 z-50 h-16 flex items-center justify-between px-4 border-b border-zinc-800 bg-black/80 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/')}
              className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-2 touch-manipulation active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="text-sm sm:text-base">Back</span>
            </button>
            <h1 className="text-lg font-semibold text-amber-400">Settings</h1>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2 bg-amber-400 text-black rounded-full text-sm font-medium flex items-center gap-2 hover:bg-amber-300 transition-colors touch-manipulation active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </header>
      )}

      {/* Content */}
      <main className="flex-1 p-4 pb-20 md:pb-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Information */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-amber-400">Profile Information</CardTitle>
              <CardDescription className="text-gray-400">
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-amber-400">First Name</Label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-zinc-800 rounded-md text-white placeholder:text-gray-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-amber-400">Last Name</Label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-zinc-800 rounded-md text-white placeholder:text-gray-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-amber-400">Phone Number</Label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-zinc-800 rounded-md text-white placeholder:text-gray-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-amber-400">Email Address</Label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-zinc-800 rounded-md text-white placeholder:text-gray-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                  placeholder="john.doe@example.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-400">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-gray-400">
                Choose how you want to be notified about new voice messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-amber-400">Notification Method</Label>
                <RadioGroup value={notificationPreference} onValueChange={(value) => setNotificationPreference(value as NotificationPreference)}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-amber-400/10 border border-transparent hover:border-amber-400/50 transition-all">
                    <RadioGroupItem value="sms" id="sms" className="text-amber-400 border-zinc-800" />
                    <Label htmlFor="sms" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 text-white">
                        <Phone className="w-4 h-4 text-amber-400" />
                        <span>SMS Text Message</span>
                      </div>
                      <p className="text-sm text-gray-400">Get instant notifications via text message</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-amber-400/10 border border-transparent hover:border-amber-400/50 transition-all">
                    <RadioGroupItem value="email" id="email-opt" className="text-amber-400 border-zinc-800" />
                    <Label htmlFor="email-opt" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 text-white">
                        <Mail className="w-4 h-4 text-amber-400" />
                        <span>Email</span>
                      </div>
                      <p className="text-sm text-gray-400">Receive notifications in your email inbox</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-amber-400/10 border border-transparent hover:border-amber-400/50 transition-all">
                    <RadioGroupItem value="both" id="both" className="text-amber-400 border-zinc-800" />
                    <Label htmlFor="both" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 text-white">
                        <Phone className="w-4 h-4 text-amber-400" />
                        <Mail className="w-4 h-4 text-amber-400" />
                        <span>Both SMS & Email</span>
                      </div>
                      <p className="text-sm text-gray-400">Get notified via both channels</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-amber-400/10 border border-transparent hover:border-amber-400/50 transition-all">
                    <RadioGroupItem value="none" id="none" className="text-amber-400 border-zinc-800" />
                    <Label htmlFor="none" className="flex-1 cursor-pointer">
                      <span className="text-white">No Notifications</span>
                      <p className="text-sm text-gray-400">Don't send any notifications</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sms-toggle" className="text-white">SMS Notifications</Label>
                    <p className="text-sm text-gray-400">
                      Enable or disable SMS notifications
                    </p>
                  </div>
                  <Switch
                    id="sms-toggle"
                    checked={smsEnabled}
                    onCheckedChange={setSmsEnabled}
                    disabled={notificationPreference === 'none'}
                    className="data-[state=checked]:bg-amber-400"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-toggle" className="text-white">Email Notifications</Label>
                    <p className="text-sm text-gray-400">
                      Enable or disable email notifications
                    </p>
                  </div>
                  <Switch
                    id="email-toggle"
                    checked={emailEnabled}
                    onCheckedChange={setEmailEnabled}
                    disabled={notificationPreference === 'none'}
                    className="data-[state=checked]:bg-amber-400"
                  />
                </div>
              </div>

              {/* Warning messages */}
              {notificationPreference !== 'none' && (
                <div className="space-y-2">
                  {(notificationPreference === 'sms' || notificationPreference === 'both') && !phone && (
                    <p className="text-sm text-red-400">
                      ⚠️ Please add a phone number to receive SMS notifications
                    </p>
                  )}
                  {(notificationPreference === 'email' || notificationPreference === 'both') && !email && (
                    <p className="text-sm text-red-400">
                      ⚠️ Please add an email address to receive email notifications
                    </p>
                  )}
                </div>
              )}

              {/* Save Button */}
              <div className="pt-4">
                <Button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="w-full bg-amber-400 text-black hover:bg-amber-300 font-medium py-3"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {saving ? 'Saving Settings...' : 'Save Notification Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification History */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-amber-400">Notification History</CardTitle>
              <CardDescription className="text-gray-400">
                View your recent notification activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Notification history will be available after the first message is sent.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Floating Save Button - only show on desktop */}
      {!isMobile && (
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-3 bg-amber-400 text-black rounded-full font-medium flex items-center gap-2 hover:bg-amber-300 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );

  return isMobile ? content : <AppLayout>{content}</AppLayout>;
} 