import axios, { AxiosResponse } from 'axios';
import {
  HealthResponse,
  UploadResponse,
  ChatResponse,
  SessionsResponse,
  SessionDetails,
  DocumentsResponse,
  ChatRequest,
  ErrorResponse,
  OneTimeUrlResponse,
  Message,
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get JWT token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

// Request interceptor for logging and auth
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Add JWT token to headers if available
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    
    if (error.response?.status === 401) {
      // Clear invalid token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
      throw new Error('Authentication required. Please log in again.');
    } else if (error.response?.status === 404) {
      throw new Error('Backend server not found. Please ensure the FastAPI server is running on port 8000.');
    } else if (error.response?.data) {
      // Handle structured error responses from FastAPI
      const errorData = error.response.data as ErrorResponse;
      console.error('API Error Response:', {
        status: error.response.status,
        data: errorData,
        url: error.config?.url,
        method: error.config?.method,
        fullUrl: `${error.config?.baseURL}${error.config?.url}`,
        headers: error.config?.headers
      });
      throw new Error(errorData.message || errorData.error || `API request failed: ${error.response.status}`);
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your connection and ensure the backend server is running.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

// API Client class
export class MedrecsApiClient {
  /**
   * Check API health status
   */
  async checkHealth(): Promise<HealthResponse> {
    const response: AxiosResponse<HealthResponse> = await apiClient.get(`${API_PREFIX}/health`);
    return response.data;
  }

  /**
   * Login user and get JWT token
   */
  async login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const formData = new FormData();
    formData.append('username', email); // OAuth2PasswordRequestForm uses 'username'
    formData.append('password', password);
    
    const response = await apiClient.post(`${API_PREFIX}/auth/token`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // Store token in localStorage
    if (typeof window !== 'undefined' && response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    
    return response.data;
  }

  /**
   * Logout user
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  }

  /**
   * Upload documents to a session
   */
  async uploadDocuments(
    sessionId: string,
    files: File[]
  ): Promise<UploadResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response: AxiosResponse<UploadResponse> = await apiClient.post(
      `${API_PREFIX}/documents/upload-batch?session_id=${sessionId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file uploads
      }
    );

    return response.data;
  }

  /**
   * Send a chat message
   */
  async sendChatMessage(question: string, sessionId?: string): Promise<ChatResponse> {
    const requestData: ChatRequest = {
      question,
      ...(sessionId && { session_id: sessionId }),
    };

    const response: AxiosResponse<ChatResponse> = await apiClient.post(
      `${API_PREFIX}/chat`,
      requestData
    );

    return response.data;
  }

  /**
   * Create a new session
   */
  async createSession(title: string = "New Chat"): Promise<{ session_id: string; title: string; created_at: string; is_active: boolean }> {
    const response: AxiosResponse<{ session_id: string; title: string; created_at: string; is_active: boolean }> = await apiClient.post(
      `${API_PREFIX}/sessions`,
      { title }
    );
    return response.data;
  }

  /**
   * Get all sessions
   */
  async getSessions(): Promise<SessionDetails[]> {
    const response: AxiosResponse<SessionsResponse> = await apiClient.get(`${API_PREFIX}/user/sessions`);
    return response.data.sessions.map(session => ({
      session_id: session.session_id,
      title: session.title,
      created_at: session.created_at,
      last_activity: session.last_activity,
      is_active: session.is_active,
      documents: [],
      messages: [],
    }));
  }

  /**
   * Get session details
   */
  async getSessionMessages(sessionId: string): Promise<{ messages: Message[] }> {
    const response: AxiosResponse<{ messages: Message[] }> = await apiClient.get(
      `${API_PREFIX}/sessions/${sessionId}/messages`
    );
    return response.data;
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<{ message: string; session_id: string }> {
    const response = await apiClient.delete(`${API_PREFIX}/sessions/${sessionId}`);
    return response.data;
  }

  /**
   * Get documents for a session
   */
  async getDocuments(sessionId: string): Promise<DocumentsResponse> {
    const response: AxiosResponse<DocumentsResponse> = await apiClient.get(
      `${API_PREFIX}/sessions/${sessionId}/documents`
    );
    return response.data;
  }

  /**
   * Generate one-time download URL for a document
   */
  async generateOneTimeUrl(documentId: string, expirationMinutes: number = 30): Promise<OneTimeUrlResponse> {
    const response: AxiosResponse<OneTimeUrlResponse> = await apiClient.post(
      `${API_PREFIX}/documents/${documentId}/generate-one-time-url?expiration_minutes=${expirationMinutes}`
    );
    return response.data;
  }

  /**
   * Delete all documents from a session
   */
  async deleteDocuments(sessionId: string): Promise<{ message: string; session_id: string; deleted_count: number }> {
    // First get all documents for the session
    const documentsResponse = await this.getDocuments(sessionId);
    
    // Delete each document individually
    const deletePromises = documentsResponse.documents.map(doc => 
      apiClient.delete(`${API_PREFIX}/documents/${doc.document_id}`)
    );
    
    await Promise.all(deletePromises);
    
    return {
      message: `Deleted ${documentsResponse.documents.length} documents from session`,
      session_id: sessionId,
      deleted_count: documentsResponse.documents.length
    };
  }
}

// Create and export a singleton instance
export const medrecsApi = new MedrecsApiClient();

// Export individual functions for convenience
export const {
  checkHealth,
  uploadDocuments,
  sendChatMessage,
  getSessions,
  getSessionMessages,
  deleteSession,
  getDocuments,
  deleteDocuments,
  generateOneTimeUrl,
} = medrecsApi;
