
import { Search, MoreVertical } from 'lucide-react';

type MessageHeaderProps = {
  currentCategory: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

const MessageHeader = ({ currentCategory, searchQuery, setSearchQuery }: MessageHeaderProps) => {
  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-border">
      <h1 className="text-xl font-semibold text-foreground capitalize">{currentCategory}</h1>
      <div className="flex items-center space-x-2">
        <div className="relative">
          <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search messages..."
            className="pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="p-2 hover:bg-accent/10 rounded-full">
          <MoreVertical className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
};

export default MessageHeader;
