'use client';

import React, { useState, useCallback } from 'react';
import { useChat } from '@/context/chat-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Trash2,
} from 'lucide-react';

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentUploadModal({ open, onOpenChange }: DocumentUploadModalProps) {
  const { currentSession, uploadDocuments, uploadProgress } = useChat();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles).filter(file => 
      file.type === 'application/pdf'
    );
    
    setFiles(prev => [...prev, ...fileArray]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!currentSession || files.length === 0) return;

    try {
      setIsUploading(true);
      await uploadDocuments(files);
      setFiles([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProgressStatus = (filename: string) => {
    const progress = uploadProgress.find(p => p.filename === filename);
    return progress || { progress: 0, status: 'uploading' as const };
  };

  if (!currentSession) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Medical Documents</DialogTitle>
          <DialogDescription>
            Upload PDF medical records to {currentSession.name}. Only PDF files are accepted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drop PDF files here or click to browse
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Only PDF files are accepted. Maximum file size: 50MB per file.
            </p>
            <Button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf';
                input.multiple = true;
                input.onchange = (e) => handleFileSelect((e.target as HTMLInputElement).files);
                input.click();
              }}
              disabled={isUploading}
            >
              Select Files
            </Button>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Selected Files ({files.length})
              </h4>
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {files.map((file, index) => {
                    const progressStatus = getProgressStatus(file.name);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {file.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {progressStatus.status === 'completed' && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {progressStatus.status === 'error' && (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                          {progressStatus.status === 'uploading' && (
                            <div className="w-16">
                              <Progress value={progressStatus.progress} className="h-2" />
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            disabled={isUploading}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Upload Progress
              </h4>
              <div className="space-y-2">
                {uploadProgress.map((progress, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {progress.filename}
                      </span>
                      <Badge
                        variant={
                          progress.status === 'completed'
                            ? 'default'
                            : progress.status === 'error'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {progress.status}
                      </Badge>
                    </div>
                    <Progress value={progress.progress} className="h-2" />
                    {progress.error && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {progress.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {files.length} file{files.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
