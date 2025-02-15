
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
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
  );
};

export default Index;
