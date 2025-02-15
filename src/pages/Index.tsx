
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <Card className="glass-panel p-8 rounded-2xl">
          <h1 className="text-4xl font-bold text-center mb-6">Voice Messenger</h1>
          <p className="text-center text-muted-foreground mb-8">
            Connect through voice messages with crystal-clear quality
          </p>
          <div className="flex justify-center space-x-4">
            <Button className="px-8 py-6 text-lg">
              Start Recording
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
