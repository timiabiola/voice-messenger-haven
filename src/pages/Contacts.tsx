
import React, { useState } from 'react'
import AppLayout from '@/components/AppLayout';
import { 
  Search, 
  Plus, 
  Phone, 
  MessageSquare,
  Video,
  Star,
  Users,
} from 'lucide-react'

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContact, setSelectedContact] = useState<number | null>(null)

  // Placeholder contact data
  const contact = {
    id: 1,
    name: 'Sarah Johnson',
    phone: '+1 (555) 123-4567',
    email: 'sarah.j@example.com',
    avatar: '/placeholder.svg',
    status: 'online',
    lastSeen: 'Today at 2:30 PM'
  }

  const alphabetIndex = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

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
            {/* Contact Item */}
            <div 
              className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b"
              onClick={() => setSelectedContact(contact.id)}
            >
              <div className="relative">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{contact.name}</h3>
                  <span className="text-sm text-gray-500">{contact.lastSeen}</span>
                </div>
                <p className="text-sm text-gray-500">{contact.phone}</p>
              </div>
            </div>

            {/* Alphabet Index - Right side */}
            <div className="absolute right-1 top-0 bottom-0">
              <div className="flex flex-col justify-center h-full">
                {alphabetIndex.map((letter) => (
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
