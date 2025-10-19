'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { medrecsApi } from '@/lib/api-client';
import { ChatMessage, SessionState, UploadProgress, Document } from '@/types/api';
import { parseEmbeddedSources, extractAnswerWithoutSources } from '@/lib/source-parser';

interface ChatContextType {
  // Current session
  currentSession: SessionState | null;
  sessions: SessionState[];
  
  // Messages
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  
  // Documents
  documents: Document[];
  isLoadingDocuments: boolean;
  
  // Upload
  uploadProgress: UploadProgress[];
  isUploading: boolean;
  
  // Actions
  createSession: (title?: string) => Promise<void>;
  selectSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  uploadDocuments: (files: File[]) => Promise<void>;
  deleteDocuments: (sessionId: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  loadMessages: (sessionId: string) => Promise<void>;
  loadDocuments: (sessionId: string) => Promise<void>;
  
  // UI state
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [currentSession, setCurrentSession] = useState<SessionState | null>(null);
  const [sessions, setSessions] = useState<SessionState[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Create a new session
  const createSession = useCallback(async (title?: string) => {
    try {
      const sessionTitle = title || `Session ${sessions.length + 1}`;
      const response = await medrecsApi.createSession(sessionTitle);
      
      const newSession: SessionState = {
        id: response.session_id,
        name: response.title,
        createdAt: new Date(response.created_at),
        lastUpdated: new Date(response.created_at),
        documentCount: 0,
        messageCount: 0,
        isActive: response.is_active,
      };

      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
      setDocuments([]);
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }, [sessions.length]);


  // Delete a session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await medrecsApi.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }, [currentSession]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!currentSession) {
      throw new Error('No session selected');
    }

    try {
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Add typing indicator
      const typingMessage: ChatMessage = {
        id: `msg_${Date.now()}_typing`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isTyping: true,
      };
      
      setMessages(prev => [...prev, typingMessage]);
      setIsLoadingMessages(true);

      // Send to API
      const response = await medrecsApi.sendChatMessage(content, currentSession.id);
      
      // Parse sources from the embedded text and clean the answer
      const parsedSources = parseEmbeddedSources(response.answer);
      const cleanAnswer = extractAnswerWithoutSources(response.answer);
      
      // Remove typing indicator and add response
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: cleanAnswer,
          timestamp: new Date(),
          sources: parsedSources,
        };
        return [...withoutTyping, assistantMessage];
      });

      // Update session message count
      setSessions(prev => prev.map(s => 
        s.id === currentSession.id 
          ? { ...s, messageCount: s.messageCount + 1, lastUpdated: new Date() }
          : s
      ));

    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove typing indicator on error
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      throw error;
    } finally {
      setIsLoadingMessages(false);
    }
  }, [currentSession]);

  // Upload documents
  const uploadDocuments = useCallback(async (files: File[]) => {
    if (!currentSession) {
      throw new Error('No session selected');
    }

    try {
      setIsUploading(true);
      
      // Initialize upload progress
      const progress: UploadProgress[] = files.map(file => ({
        filename: file.name,
        progress: 0,
        status: 'uploading',
      }));
      setUploadProgress(progress);

      // Upload files
      const response = await medrecsApi.uploadDocuments(currentSession.id, files);
      
      // Update progress to completed
      setUploadProgress(prev => prev.map(p => ({
        ...p,
        progress: 100,
        status: 'completed' as const,
      })));

      // Update session document count
      setSessions(prev => prev.map(s => 
        s.id === currentSession.id 
          ? { ...s, documentCount: s.documentCount + files.length, lastUpdated: new Date() }
          : s
      ));

      // Reload documents
      await loadDocuments(currentSession.id);

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress([]);
      }, 2000);

    } catch (error) {
      console.error('Failed to upload documents:', error);
      // Update progress to error
      setUploadProgress(prev => prev.map(p => ({
        ...p,
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Upload failed',
      })));
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [currentSession]);


  // Load sessions
  const loadSessions = useCallback(async () => {
    try {
      const response = await medrecsApi.getSessions();
      
      const sessionStates: SessionState[] = await Promise.all(
        response.map(async (session) => {
          let documentCount = 0;
          let messageCount = 0;
          
          try {
            const documentsResponse = await medrecsApi.getDocuments(session.session_id);
            documentCount = documentsResponse.total_documents || 0;
          } catch (error) {
            console.warn(`Failed to load documents for session ${session.session_id}:`, error);
            // Continue with documentCount = 0 if documents fail to load
          }
          
          try {
            const messagesResponse = await medrecsApi.getSessionMessages(session.session_id);
            messageCount = messagesResponse.messages.length;
          } catch (error) {
            console.warn(`Failed to load messages for session ${session.session_id}:`, error);
            // Continue with messageCount = 0 if messages fail to load
          }
          
          return {
            id: session.session_id,
            name: session.title || `Session ${session.session_id.substring(0, 8)}`,
            createdAt: new Date(session.created_at || new Date()),
            lastUpdated: new Date(session.last_activity || session.created_at || new Date()),
            documentCount,
            messageCount,
            isActive: true,
          };
        })
      );
      
      setSessions(sessionStates);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      // Don't throw error, just log it and set empty sessions
      setSessions([]);
    }
  }, []);

  // Load messages for a session
  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      setIsLoadingMessages(true);
      const sessionMessages = await medrecsApi.getSessionMessages(sessionId);
      
      // Transform the messages to create proper conversation pairs
      const chatMessages: ChatMessage[] = [];
      
      sessionMessages.messages.forEach(msg => {
        // Add user message (the query)
        if (msg.query) {
          chatMessages.push({
            id: `${msg.message_id}_user`,
            role: 'user',
            content: msg.query,
            timestamp: new Date(msg.timestamp),
          });
        }
        
        // Add assistant message (the answer)
        if (msg.answer) {
          // Parse sources from the embedded text and clean the answer
          const parsedSources = parseEmbeddedSources(msg.answer);
          const cleanAnswer = extractAnswerWithoutSources(msg.answer);

          chatMessages.push({
            id: `${msg.message_id}_assistant`,
            role: 'assistant',
            content: cleanAnswer,
            timestamp: new Date(msg.timestamp),
            sources: parsedSources,
          });
        }
      });
      
      setMessages(chatMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      throw error;
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Load documents for a session
  const loadDocuments = useCallback(async (sessionId: string) => {
    try {
      setIsLoadingDocuments(true);
      const response = await medrecsApi.getDocuments(sessionId);
      setDocuments(response.documents);
    } catch (error) {
      console.error('Failed to load documents:', error);
      // Don't throw error, just set empty documents
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  // Select a session
  const selectSession = useCallback(async (sessionId: string) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setCurrentSession(session);
        await loadMessages(sessionId);
        await loadDocuments(sessionId);
      }
    } catch (error) {
      console.error('Failed to select session:', error);
      throw error;
    }
  }, [sessions, loadMessages, loadDocuments]);

  // Delete documents from a session
  const deleteDocuments = useCallback(async (sessionId: string) => {
    try {
      await medrecsApi.deleteDocuments(sessionId);
      // Reload documents after deletion
      await loadDocuments(sessionId);
      // Update session document count
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, documentCount: 0, lastUpdated: new Date() }
          : s
      ));
    } catch (error) {
      console.error('Failed to delete documents:', error);
      throw error;
    }
  }, [loadDocuments]);

  const value: ChatContextType = {
    currentSession,
    sessions,
    messages,
    documents,
    uploadProgress,
    isLoadingMessages,
    isLoadingDocuments,
    isUploading,
    isSidebarOpen,
    setSidebarOpen: setIsSidebarOpen,
    createSession,
    selectSession,
    deleteSession,
    sendMessage,
    uploadDocuments,
    deleteDocuments,
    loadSessions,
    loadMessages,
    loadDocuments,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
