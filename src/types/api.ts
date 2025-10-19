// API Types for FastAPI Medrecs Backend Integration

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

export interface DocumentResult {
  filename: string;
  status: 'success' | 'failed';
  message?: string;
  reason?: string;
}

export interface ReportItem {
  id: number;
  question: string;
  answer: string;
}

export interface UploadResponse {
  session_id: string;
  results: DocumentResult[];
  report: ReportItem[];
  processing_time: number;
}

export interface Source {
  label: string;
  document_id: string;
  filename: string;
  date: string;
  pages_cited: number[];
}

export interface ChatResponse {
  answer: string;
  session_id: string;
  sources: Source[];
  processing_time: number;
}

export interface Session {
  session_id: string;
  title: string;
  created_at: string;
  last_activity: string;
  is_active: boolean;
}

export interface SessionsResponse {
  success: boolean;
  sessions: Session[];
  total_sessions: number;
}

export interface Document {
  document_id: string;
  file_name: string;
  status: 'READY' | 'PROCESSING' | 'FAILED' | 'processed' | 'processing' | 'failed';
  uploaded_at: string;
  gcs_input_path: string;
  gcs_output_path: string;
  file_size?: number;
  page_count?: number;
  extracted_text_length?: number;
}

export interface SessionDetails {
  session_id: string;
  title: string;
  created_at: string;
  last_activity: string;
  is_active: boolean;
  documents: Document[];
  messages: Message[];
}

export interface Message {
  message_id: string;
  session_id: string;
  timestamp: string;
  query: string;
  answer: string;
  message_type: 'query' | 'research';
  sources?: Source[];
}

export interface DocumentsResponse {
  session_id: string;
  session_title: string;
  total_documents: number;
  documents: Document[];
}

export interface ChatRequest {
  question: string;
  session_id?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Frontend-specific types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: ParsedSource[];
  isTyping?: boolean;
}

export interface SessionState {
  id: string;
  name: string;
  createdAt: Date;
  lastUpdated: Date;
  documentCount: number;
  messageCount: number;
  isActive: boolean;
}

export interface UploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface ParsedSource {
  label: string;
  filename: string;
  document_id: string;
  date: string;
}

export interface OneTimeUrlResponse {
  document_id: string;
  file_name: string;
  one_time_url: string;
  expires_in_minutes: number;
  expires_at: string;
  warning: string;
  usage_tips: string[];
}
