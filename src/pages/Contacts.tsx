
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  X, 
  Star, 
  Clock, 
  Users, 
  ChevronRight,
  UserPlus 
} from "lucide-react";
import { cn, formatNameWithInitial } from "@/lib/utils";

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface GroupedContacts {
  [key: string]: Profile[];
}

// Alphabet for navigation
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function Contacts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentContacts, setRecentContacts] = useState<string[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  // Load favorites and recent contacts from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('contactFavorites');
    const savedRecent = localStorage.getItem('recentContacts');
    
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
    
    if (savedRecent) {
      setRecentContacts(JSON.parse(savedRecent));
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('contactFavorites', JSON.stringify([...favorites]));
  }, [favorites]);

  // Save recent contacts to localStorage
  useEffect(() => {
    localStorage.setItem('recentContacts', JSON.stringify(recentContacts));
  }, [recentContacts]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, avatar_url, created_at")
        .order("first_name");

      if (error) {
        console.error("Error fetching profiles:", error);
        toast({
          title: "Error",
          description: "Failed to load contacts. Please try again.",
          variant: "destructive",
        });
      } else {
        setProfiles(data || []);
      }
    } catch (error) {
      console.error("Error in fetchProfiles:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFormattedName = (profile: Profile) => {
    return formatNameWithInitial(profile.first_name, profile.last_name);
  };

  const getInitial = (profile: Profile) => {
    if (profile.first_name) {
      return profile.first_name.charAt(0).toUpperCase();
    }
    return "?";
  };

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return profiles;
    
    const query = searchQuery.toLowerCase();
    return profiles.filter(profile => {
      const firstName = profile.first_name?.toLowerCase() || '';
      const lastName = profile.last_name?.toLowerCase() || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName.includes(query) || firstName.includes(query) || lastName.includes(query);
    });
  }, [profiles, searchQuery]);

  // Group contacts by first letter
  const groupedContacts = useMemo((): GroupedContacts => {
    const groups: GroupedContacts = {};
    
    filteredContacts.forEach(profile => {
      const firstLetter = getInitial(profile);
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(profile);
    });
    
    return groups;
  }, [filteredContacts]);

  // Get contacts for current tab
  const displayedContacts = useMemo(() => {
    switch (activeTab) {
      case 'recent':
        return profiles.filter(p => recentContacts.includes(p.id));
      case 'favorites':
        return profiles.filter(p => favorites.has(p.id));
      default:
        return filteredContacts;
    }
  }, [activeTab, profiles, filteredContacts, recentContacts, favorites]);

  // Group displayed contacts
  const displayedGroupedContacts = useMemo((): GroupedContacts => {
    const groups: GroupedContacts = {};
    
    displayedContacts.forEach(profile => {
      const firstLetter = getInitial(profile);
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(profile);
    });
    
    return groups;
  }, [displayedContacts]);

  const handleContactClick = (profile: Profile) => {
    // Add to recent contacts
    setRecentContacts(prev => {
      const updated = [profile.id, ...prev.filter(id => id !== profile.id)];
      return updated.slice(0, 10); // Keep only last 10
    });

    navigate("/microphone", {
      state: {
        selectedProfile: {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          name: getFormattedName(profile),
        },
      },
    });
  };

  const toggleFavorite = useCallback((e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(profileId)) {
        newFavorites.delete(profileId);
        toast({
          title: "Removed from favorites",
          duration: 2000,
        });
      } else {
        newFavorites.add(profileId);
        toast({
          title: "Added to favorites",
          duration: 2000,
        });
      }
      return newFavorites;
    });
  }, [toast]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  const scrollToLetter = (letter: string) => {
    setSelectedLetter(letter);
    const element = document.getElementById(`section-${letter}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const ContactCard = ({ profile }: { profile: Profile }) => {
    const isFavorite = favorites.has(profile.id);
    const isRecent = recentContacts.includes(profile.id);
    
    return (
      <div
        className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors border-b"
        onClick={() => handleContactClick(profile)}
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-lg font-medium">
              {getInitial(profile)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-base">{getFormattedName(profile)}</p>
            {isRecent && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Recently contacted
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => toggleFavorite(e, profile.id)}
          >
            <Star 
              className={cn(
                "h-4 w-4",
                isFavorite ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
              )} 
            />
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  };

  const ContactSkeleton = () => (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div>
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-8 w-8" />
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Users className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <AppLayout>
      <div className="flex h-full">
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Contacts</h1>
                <Badge variant="secondary" className="ml-2">
                  {profiles.length}
                </Badge>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Contact
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="gap-2">
                  <Users className="h-4 w-4" />
                  All ({profiles.length})
                </TabsTrigger>
                <TabsTrigger value="recent" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Recent ({recentContacts.length})
                </TabsTrigger>
                <TabsTrigger value="favorites" className="gap-2">
                  <Star className="h-4 w-4" />
                  Favorites ({favorites.size})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex relative">
            {/* Contacts List */}
            <ScrollArea className="flex-1">
              <div className="pb-4">
                {loading ? (
                  <>
                    <ContactSkeleton />
                    <ContactSkeleton />
                    <ContactSkeleton />
                    <ContactSkeleton />
                  </>
                ) : displayedContacts.length === 0 ? (
                  <EmptyState 
                    message={
                      searchQuery 
                        ? "No contacts found matching your search" 
                        : activeTab === 'recent'
                        ? "No recent contacts"
                        : activeTab === 'favorites'
                        ? "No favorite contacts yet"
                        : "No contacts available"
                    }
                  />
                ) : (
                  Object.entries(displayedGroupedContacts)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([letter, contacts]) => (
                      <div key={letter} id={`section-${letter}`}>
                        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-2 border-b">
                          <h2 className="text-sm font-semibold text-muted-foreground">
                            {letter}
                          </h2>
                        </div>
                        {contacts.map((profile) => (
                          <ContactCard key={profile.id} profile={profile} />
                        ))}
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>

            {/* Alphabet Navigation (Desktop only) */}
            {!loading && displayedContacts.length > 0 && (
              <div className="hidden lg:flex flex-col gap-0 py-4 px-2 border-l">
                {ALPHABET.map((letter) => {
                  const hasContacts = displayedGroupedContacts[letter];
                  return (
                    <button
                      key={letter}
                      onClick={() => hasContacts && scrollToLetter(letter)}
                      disabled={!hasContacts}
                      className={cn(
                        "text-xs w-6 h-6 rounded hover:bg-muted transition-colors",
                        hasContacts 
                          ? "text-foreground cursor-pointer" 
                          : "text-muted-foreground/30 cursor-default",
                        selectedLetter === letter && "bg-muted"
                      )}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
