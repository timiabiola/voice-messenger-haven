
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns';

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  created_at: string;
  updated_at: string;
}

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  status: 'online' | 'offline' | 'away';
  last_seen: string;
  user_id: string;
}

type ContactGroup = {
  id: string;
  name: string;
}

const Contacts = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch all profiles
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles', searchQuery],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession()
      
      let query = supabase
        .from('profiles')
        .select('*')
      
      if (searchQuery) {
        query = query.ilike('full_name', `%${searchQuery}%`)
          .or(`email.ilike.%${searchQuery}%`)
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching profiles:', error)
        throw error
      }
      
      return data as Profile[]
    }
  })

  // Setup realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Realtime update:', payload);
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <AppLayout>
      {/* Main Content */}
      <div className="flex-1 flex flex-col pt-16">
        {/* Search Bar */}
        <div className="p-4 bg-white">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          <div className="relative">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading users...</div>
            ) : profiles && profiles.length > 0 ? (
              profiles.map(profile => (
                <div 
                  key={profile.id}
                  className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b"
                  onClick={() => navigate('/microphone', { state: { selectedProfile: profile } })}
                >
                  <div className="relative">
                    <img
                      src={profile.avatar_url || '/placeholder.svg'}
                      alt={profile.full_name || 'User'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>
                  
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{profile.full_name || 'Anonymous User'}</h3>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{profile.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? 'No users found matching your search' : 'No users found'}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default Contacts;
