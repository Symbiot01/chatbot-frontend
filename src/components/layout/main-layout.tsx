'use client';

import React from 'react';
import { useChat } from '@/context/chat-context';
import { SessionSidebar } from '@/components/chat/session-sidebar';
import { MainChatInterface } from '@/components/chat/main-chat-interface';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isSidebarOpen, setSidebarOpen } = useChat();

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div className={`${
        isSidebarOpen ? 'w-80' : 'w-0'
      } transition-all duration-300 ease-in-out overflow-hidden h-full`}>
        <SessionSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Medrecs Chat
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children || <MainChatInterface />}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
