
import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Plus, 
  Phone, 
  MessageSquare,
  Video,
  Star,
  Users,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns';

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  status: 'online' | 'offline' | 'away';
  last_seen: string;
}

type ContactGroup = {
  id: string;
  name: string;
}

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContact, setSelectedContact] = useState<string | null>(null)

  // Fetch contacts
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('*')
        
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
      }
      
      const { data, error } = await query.order('name')
      
      if (error) throw error
      return data as Contact[]
    }
  })

  // Fetch contact groups
  const { data: groups } = useQuery({
    queryKey: ['contact_groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_groups')
        .select('*')
      
      if (error) throw error
      return data as ContactGroup[]
    }
  })

  const formatLastSeen = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  }

  const getStatusColor = (status: Contact['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'away':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

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
              placeholder="Search contacts..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          <div className="relative">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading contacts...</div>
            ) : contacts && contacts.length > 0 ? (
              contacts.map(contact => (
                <div 
                  key={contact.id}
                  className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b"
                  onClick={() => setSelectedContact(contact.id)}
                >
                  <div className="relative">
                    <img
                      src={contact.avatar_url || '/placeholder.svg'}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(contact.status)} rounded-full border-2 border-white`} />
                  </div>
                  
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{contact.name}</h3>
                      <span className="text-sm text-gray-500">
                        {formatLastSeen(contact.last_seen)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{contact.phone}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No contacts found
              </div>
            )}

            {/* Alphabet Index - Right side */}
            <div className="absolute right-1 top-0 bottom-0">
              <div className="flex flex-col justify-center h-full">
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => (
                  <button
                    key={letter}
                    className="text-xs text-[#2196F3] py-1 hover:text-blue-800"
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Actions Menu - Shows when contact is selected */}
        {selectedContact && (
          <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 animate-slide-in">
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: <Phone className="w-6 h-6" />, label: 'Call' },
                { icon: <MessageSquare className="w-6 h-6" />, label: 'Message' },
                { icon: <Video className="w-6 h-6" />, label: 'Video' },
                { icon: <Star className="w-6 h-6" />, label: 'Favorite' }
              ].map((action, i) => (
                <button
                  key={i}
                  className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-50"
                >
                  {action.icon}
                  <span className="text-sm">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default Contacts;
