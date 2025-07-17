import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import ErrorBoundary from './ErrorBoundary';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
}

function AsyncErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="w-6 h-6" />
        <h2 className="text-lg font-semibold">Failed to load data</h2>
      </div>
      
      <p className="text-muted-foreground text-center max-w-md">
        We couldn't load the requested information. This might be a temporary issue.
      </p>
      
      <Button
        onClick={resetErrorBoundary}
        variant="default"
        size="sm"
        className="flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </Button>
    </div>
  );
}

export function AsyncErrorBoundary({ children }: AsyncErrorBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();
  
  return (
    <ErrorBoundary
      fallback={null}
      onReset={reset}
    >
      {children}
    </ErrorBoundary>
  );
}

// Export a hook for manual error handling
export function useAsyncError() {
  return (error: Error) => {
    throw error;
  };
}