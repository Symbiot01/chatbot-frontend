'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/context/chat-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Upload, X } from 'lucide-react';
import { DocumentUploadModal } from './document-upload-modal';

export function ChatInput() {
  const { currentSession, sendMessage, isUploading } = useChat();
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isResearchMode, setIsResearchMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Handle Enter key (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Check if input starts with @research
  useEffect(() => {
    setIsResearchMode(input.startsWith('@research'));
  }, [input]);

  const handleSubmit = async () => {
    if (!input.trim() || !currentSession || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const message = isResearchMode ? input : input.trim();
      await sendMessage(message);
      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  if (!currentSession) {
    return null;
  }

  return (
    <>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          {/* Research Mode Indicator */}
          {isResearchMode && (
            <div className="mb-3">
              <Badge variant="secondary" className="text-xs">
                Research Mode - Accessing external medical literature
              </Badge>
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isResearchMode 
                    ? "Ask a research question about medical topics..."
                    : "Ask about your medical documents or use @research for general queries..."
                }
                className="min-h-[44px] max-h-32 resize-none pr-12"
                disabled={isSubmitting || isUploading}
              />
              <div className="absolute right-2 top-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUploadClick}
                  disabled={isSubmitting || isUploading}
                  className="h-8 w-8 p-0"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isSubmitting || isUploading}
              className="px-4"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Helper Text */}
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Press Enter to send, Shift+Enter for new line. Use @research for general medical queries.
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
      />
    </>
  );
}
