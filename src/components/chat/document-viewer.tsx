'use client';

import React, { useState } from 'react';
import { useChat } from '@/context/chat-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Eye,
  Calendar,
  File,
} from 'lucide-react';
import { format } from 'date-fns';

export function DocumentViewer() {
  const {
    currentSession,
    documents,
    isLoadingDocuments,
    uploadDocuments,
    deleteDocuments,
  } = useChat();
  const [isUploading, setIsUploading] = useState(false);

  // Debug logging

  const handleFileUpload = async (files: File[]) => {
    if (!currentSession) return;

    try {
      setIsUploading(true);
      await uploadDocuments(files);
    } catch (error) {
      console.error('Failed to upload documents:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocuments = async () => {
    if (!currentSession) return;

    try {
      await deleteDocuments(currentSession.id);
    } catch (error) {
      console.error('Failed to delete documents:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY':
      case 'processed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PROCESSING':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'FAILED':
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!currentSession) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Select a session to view documents</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Documents
          </h3>
          <div className="flex items-center gap-2">
            {documents.length > 0 && (
              <Button
                onClick={handleDeleteDocuments}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf';
            input.multiple = true;
            input.onchange = (e) => {
              const files = Array.from((e.target as HTMLInputElement).files || []);
              if (files.length > 0) {
                handleFileUpload(files);
              }
            };
            input.click();
          }}
        >
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click to upload PDF files
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Drag and drop or click to browse
          </p>
        </div>
      </div>

      {/* Documents List */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="p-4">
          {isLoadingDocuments ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-3">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </Card>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                No documents uploaded
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Upload PDF medical records to start asking questions
              </p>
            </div>
          ) : (
            <div className="space-y-3">
            {documents.map((doc, index) => (
              <Card key={index} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {doc.file_name}
                      </h4>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getStatusColor(doc.status)}`}
                        >
                          {doc.status}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {doc.file_size ? formatFileSize(doc.file_size) : 'Unknown size'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      
                      {doc.page_count && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {doc.page_count} pages
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      title="View document"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      title="Download document"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Upload Progress */}
      {isUploading && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            Uploading documents...
          </div>
        </div>
      )}
    </div>
  );
}
