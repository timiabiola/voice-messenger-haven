
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CategoryTabs from "@/components/layout/CategoryTabs";

const Index = () => {
  const [currentCategory, setCurrentCategory] = useState('inbox');
  const counts = {
    new: 3,
    inbox: 12,
    saved: 5,
    trash: 2,
  };

  return (
    <>
      <CategoryTabs 
        currentCategory={currentCategory}
        setCurrentCategory={setCurrentCategory}
        counts={counts}
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary pt-14">
        <div className="container mx-auto px-4 py-8 animate-fade-in">
          <Card className="glass-panel p-6 rounded-2xl">
            <h1 className="text-3xl font-bold text-center mb-4">Voice Messenger</h1>
            <p className="text-center text-muted-foreground mb-6">
              Connect through voice messages with crystal-clear quality
            </p>
            <div className="flex justify-center">
              <Button className="px-6 py-4 text-base">
                Start Recording
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Index;
