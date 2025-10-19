'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import { MainLayout } from '@/components/layout/main-layout';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChatPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { loadSessions } = useChat();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Load sessions when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      loadSessions().catch(console.error);
    }
  }, [isAuthenticated, loadSessions]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <MainLayout>
      {/* Main chat interface is rendered by MainLayout */}
    </MainLayout>
  );
}
