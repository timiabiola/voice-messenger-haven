import { useState, useEffect } from 'react';
import { Settings, Bell, BellOff, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { NotificationPreference } from '@/types/notifications';

interface SettingsWidgetProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const SettingsWidget = ({ 
  className, 
  position = 'bottom-right' 
}: SettingsWidgetProps) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [notificationPref, setNotificationPref] = useState<NotificationPreference>('sms');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotificationPreference();
  }, []);

  const loadNotificationPreference = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preference')
        .eq('id', user.id)
        .single();

      if (profile) {
        setNotificationPref(profile.notification_preference || 'sms');
      }
    } catch (error) {
      console.error('Error loading notification preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = () => {
    if (notificationPref === 'none') return <BellOff className="w-4 h-4" />;
    if (notificationPref === 'sms') return <Phone className="w-4 h-4" />;
    if (notificationPref === 'email') return <Mail className="w-4 h-4" />;
    return <Bell className="w-4 h-4" />;
  };

  const getNotificationText = () => {
    if (notificationPref === 'none') return 'Notifications Off';
    if (notificationPref === 'sms') return 'SMS Notifications';
    if (notificationPref === 'email') return 'Email Notifications';
    return 'SMS & Email';
  };

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4 md:bottom-4',
    'bottom-left': 'bottom-20 left-4 md:bottom-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4'
  };

  return (
    <div 
      className={cn(
        "fixed z-40 transition-all duration-300",
        positionClasses[position],
        className
      )}
    >
      <div 
        className={cn(
          "bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-full transition-all duration-300 overflow-hidden",
          isExpanded ? "w-48" : "w-12"
        )}
      >
        <div className="flex items-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-3 text-amber-400 hover:text-amber-300 transition-colors"
            title="Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
          
          {isExpanded && (
            <div className="flex items-center pr-3 animate-in slide-in-from-left duration-300">
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-amber-400 transition-colors"
              >
                {!loading && (
                  <>
                    {getNotificationIcon()}
                    <span className="whitespace-nowrap">{getNotificationText()}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Tooltip on hover when collapsed */}
      {!isExpanded && (
        <div className="absolute bottom-full mb-2 right-0 opacity-0 hover:opacity-100 pointer-events-none transition-opacity">
          <div className="bg-zinc-900 text-amber-400 text-xs px-2 py-1 rounded whitespace-nowrap">
            {getNotificationText()}
          </div>
        </div>
      )}
    </div>
  );
}; 