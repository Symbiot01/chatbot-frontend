'use client';

import React, { useState } from 'react';
import { useChat } from '@/context/chat-context';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  MessageSquare,
  Trash2,
  MoreVertical,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Settings,
  Edit,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SessionNamingModal } from './session-naming-modal';

interface SessionSidebarProps {
  className?: string;
}

export function SessionSidebar({ className }: SessionSidebarProps) {
  const {
    sessions,
    currentSession,
    isSidebarOpen,
    setSidebarOpen,
    createSession,
    selectSession,
    deleteSession,
    loadSessions,
  } = useChat();
  
  const { user, logout } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isNamingModalOpen, setIsNamingModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<{ id: string; name: string } | null>(null);

  const handleCreateSession = async (title?: string) => {
    try {
      setIsLoading(true);
      await createSession(title);
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNamingModal = () => {
    setEditingSession(null);
    setIsNamingModalOpen(true);
  };

  const handleOpenRenameModal = (sessionId: string, sessionName: string) => {
    setEditingSession({ id: sessionId, name: sessionName });
    setIsNamingModalOpen(true);
  };

  const handleConfirmNaming = async (title: string) => {
    if (editingSession) {
      // Session renaming is not yet supported by the API
      alert('Session renaming is not yet supported. This feature will be available in a future update.');
      setIsNamingModalOpen(false);
    } else {
      await handleCreateSession(title);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    try {
      await selectSession(sessionId);
    } catch (error) {
      console.error('Failed to select session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleLoadSessions = async () => {
    try {
      setIsLoading(true);
      await loadSessions();
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sessions
          </h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenNamingModal}
              disabled={isLoading}
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 lg:hidden"
            >
              {isSidebarOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-3">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </Card>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No sessions yet
            </p>
            <Button onClick={handleOpenNamingModal} size="sm">
              Create your first session
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className={`p-3 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  currentSession?.id === session.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                    : ''
                }`}
                onClick={() => handleSelectSession(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {session.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <MessageSquare className="h-3 w-3" />
                        <span>{session.messageCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <FileText className="h-3 w-3" />
                        <span>{session.documentCount}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 dark:text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {session.lastUpdated && !isNaN(session.lastUpdated.getTime())
                          ? formatDistanceToNow(session.lastUpdated, { addSuffix: true })
                          : 'Unknown'
                        }
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenRenameModal(session.id, session.name);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        {user ? (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-500 text-white text-sm">
                {user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Not logged in
            </p>
          </div>
        )}
        
        {/* Refresh Button */}
        <Button
          onClick={handleLoadSessions}
          variant="outline"
          size="sm"
          className="w-full mt-3"
          disabled={isLoading}
        >
          Refresh Sessions
        </Button>
      </div>

      {/* Session Naming Modal */}
      <SessionNamingModal
        isOpen={isNamingModalOpen}
        onClose={() => setIsNamingModalOpen(false)}
        onConfirm={handleConfirmNaming}
        initialTitle={editingSession?.name || ''}
        isEditing={!!editingSession}
      />
    </div>
  );
}
