'use client';

import React from 'react';
import { useChat } from '@/context/chat-context';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { DocumentViewer } from './document-viewer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, MessageSquare, FileText } from 'lucide-react';

interface MainChatInterfaceProps {
  className?: string;
}

export function MainChatInterface({ className }: MainChatInterfaceProps) {
  const {
    currentSession,
    messages,
    documents,
    isLoadingMessages,
    isUploading,
    uploadDocuments,
  } = useChat();

  if (!currentSession) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-8 ${className}`}>
        <div className="text-center max-w-md">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to Medrecs Chat
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Select a session from the sidebar or create a new one to start chatting about your medical documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentSession.name}
            </h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{messages.length} messages</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{documents.length} documents</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                Uploading...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {isLoadingMessages && messages.length === 0 ? (
            <div className="flex-1 p-8">
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Ask questions about your uploaded medical documents or use @research for general medical queries.
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Try asking:
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      • &ldquo;What are my current medications?&rdquo;
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      • &ldquo;Summarize my recent lab results&rdquo;
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      • &ldquo;@research What are the latest diabetes treatments?&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <MessageList />
            </div>
          )}
          <div className="flex-shrink-0">
            <ChatInput />
          </div>
        </div>

        {/* Documents Sidebar */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <DocumentViewer />
        </div>
      </div>
    </div>
  );
}
