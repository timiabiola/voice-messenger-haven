
import { useState } from 'react';
import SidebarLayout from '@/components/layout/SidebarLayout';

const SelectLeft = () => {
  return (
    <SidebarLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Select Tools</h1>
        {/* Selection tools content will go here */}
      </div>
    </SidebarLayout>
  );
};

export default SelectLeft;
