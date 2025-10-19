'use client';

import React, { useState } from 'react';
import { ChatMessage, ParsedSource } from '@/types/api';
import { medrecsApi } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  User,
  Bot,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === 'user';
  const isTyping = message.isTyping;


  const formatTimestamp = (timestamp: Date) => {
    return format(timestamp, 'HH:mm');
  };

  const handleDownloadDocument = async (source: ParsedSource) => {
    try {
      const response = await medrecsApi.generateOneTimeUrl(source.document_id, 30);
      // Open the one-time URL in a new tab for download
      window.open(response.one_time_url, '_blank');
    } catch (error) {
      console.error('Failed to generate download URL:', error);
      // Fallback: show an alert or toast notification
      alert('Failed to generate download link. Please try again.');
    }
  };

  // Process message content to replace source references with clickable links
  const processMessageContent = (content: string, sources: ParsedSource[] = []) => {
    if (!sources || sources.length === 0) {
      return content;
    }

    let processedContent = content;
    
    // Only replace source references that appear in proper context within the actual content
    // Be very conservative to avoid creating links in metadata sections
    sources.forEach((source, index) => {
      const sourceRef = source.label; // e.g., "file1", "file2"
      
      // Only create links for source references that appear in parentheses with "source:" context
      // This ensures we only link references that are actually cited in the text
      const linkPattern = new RegExp(`\\(source:\\s*${sourceRef}\\b`, 'g');
      
      processedContent = processedContent.replace(linkPattern, (match) => {
        return `(source: [${sourceRef}](#source-${index})`;
      });
    });

    return processedContent;
  };

  const renderSources = (sources: ParsedSource[]) => {
    if (!sources || sources.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSources(!showSources)}
            className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
          >
            {showSources ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Hide Sources ({sources.length})
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show Sources ({sources.length})
              </>
            )}
          </Button>
          <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
        </div>
        
        {showSources && (
          <ScrollArea className="max-h-48">
            <div className="space-y-3">
              {sources.map((source, index) => (
                <Card key={index} className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {source.filename}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {source.label}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span>ID: {source.document_id.substring(0, 8)}...</span>
                          <span>•</span>
                          <span>{source.date}</span>
                        </div>
                        <div className="mt-2">
                          <Button
                            onClick={() => handleDownloadDocument(source)}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    );
  };

  if (isTyping) {
    return (
      <div className="flex justify-start">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 max-w-xs">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}>
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : 'text-left'}`}>
          <div className={`inline-block ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
          } rounded-lg px-4 py-2 max-w-full`}>
            <div className="prose prose-sm max-w-none break-words dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom styling for markdown elements
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-medium mb-1 mt-2 first:mt-0">{children}</h3>,
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children }) => <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                  pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto mb-2">{children}</pre>,
                  a: ({ href, children }) => {
                    // Check if this is a source link
                    if (href?.startsWith('#source-')) {
                      const sourceIndex = parseInt(href.replace('#source-', ''));
                      const source = message.sources?.[sourceIndex];
                      
                      if (source) {
                        return (
                          <button
                            onClick={() => handleDownloadDocument(source)}
                            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <FileText className="h-2.5 w-2.5" />
                            {children}
                            <Download className="h-2.5 w-2.5" />
                          </button>
                        );
                      }
                    }
                    
                    // Regular external link
                    return (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        {children}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    );
                  },
                }}
              >
                {processMessageContent(message.content, message.sources)}
              </ReactMarkdown>
            </div>
          </div>
          
          {/* Timestamp */}
          <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
            isUser ? 'text-right' : 'text-left'
          }`}>
            {formatTimestamp(message.timestamp)}
          </div>

          {/* Sources (only for assistant messages) */}
          {!isUser && message.sources && message.sources.length > 0 && renderSources(message.sources)}
        </div>
      </div>
    </div>
  );
}
