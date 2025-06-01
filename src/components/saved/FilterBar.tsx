import { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagSelect: (tagId: string) => void;
  onTagRemove: (tagId: string) => void;
  onClearFilters: () => void;
}

export const FilterBar = ({
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagSelect,
  onTagRemove,
  onClearFilters,
}: FilterBarProps) => {
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');

  // Fetch all user tags
  const { data: tags } = useQuery({
    queryKey: ['user-tags'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return [];

      const { data, error } = await supabase
        .from('tags')
        .select('id, name')
        .eq('user_id', session.session.user.id)
        .order('name');

      if (error) {
        console.error('Error fetching tags:', error);
        return [];
      }

      return data || [];
    },
  });

  const filteredTags = tags?.filter(tag =>
    tag.name.toLowerCase().includes(tagSearch.toLowerCase())
  ) || [];

  const selectedTagObjects = tags?.filter(tag => selectedTags.includes(tag.id)) || [];

  const hasActiveFilters = searchQuery.length > 0 || selectedTags.length > 0;

  return (
    <div className="space-y-3 mb-4">
      {/* Search and filter controls */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search saved messages..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-gray-500"
          />
        </div>

        <Popover open={isTagsOpen} onOpenChange={setIsTagsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="border-zinc-800 hover:bg-zinc-800 text-amber-400"
            >
              <Filter className="w-4 h-4 mr-2" />
              Tags
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-amber-400 text-black">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="end">
            <div className="p-3 border-b">
              <Input
                type="text"
                placeholder="Search tags..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {filteredTags.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No tags found</p>
              ) : (
                <div className="space-y-1">
                  {filteredTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        if (selectedTags.includes(tag.id)) {
                          onTagRemove(tag.id);
                        } else {
                          onTagSelect(tag.id);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedTags.includes(tag.id)
                          ? 'bg-amber-400/20 text-amber-400'
                          : 'hover:bg-zinc-800 text-gray-300'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-400 hover:text-white"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Active filters display */}
      {selectedTagObjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-400">Filtered by:</span>
          {selectedTagObjects.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="bg-amber-400/10 text-amber-400 border-amber-400/20"
            >
              {tag.name}
              <button
                onClick={() => onTagRemove(tag.id)}
                className="ml-1 hover:bg-amber-400/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}; 