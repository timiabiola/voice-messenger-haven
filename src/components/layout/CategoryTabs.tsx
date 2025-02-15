
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CategoryTabsProps = {
  currentCategory: string;
  setCurrentCategory: (category: string) => void;
  counts: {
    new: number;
    inbox: number;
    saved: number;
    trash: number;
  };
};

export const CategoryTabs = ({ currentCategory, setCurrentCategory, counts }: CategoryTabsProps) => {
  const categories = [
    { id: 'new', label: 'New', count: counts.new },
    { id: 'inbox', label: 'Inbox', count: counts.inbox },
    { id: 'saved', label: 'Saved', count: counts.saved },
    { id: 'trash', label: 'Trash', count: counts.trash },
  ];

  return (
    <div className="grid grid-cols-4 border-b fixed top-14 left-0 right-0 bg-white z-10 max-w-3xl mx-auto">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => setCurrentCategory(category.id)}
          className={`p-4 text-sm ${currentCategory === category.id ? 'text-[#2196F3] border-b-2 border-[#2196F3]' : 'text-[#9E9E9E]'}`}
        >
          <div className="flex flex-col items-center">
            <span>{category.label}</span>
            <span className="text-xs text-[#757575]">({category.count})</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;
