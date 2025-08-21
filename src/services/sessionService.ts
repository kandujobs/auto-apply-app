import { supabase } from '../supabaseClient';
import { getBackendEndpoint, getBackendUrl } from '../utils/backendUrl';

export interface SessionStatus {
  isActive: boolean;
  sessionActive?: boolean;
  browserRunning?: boolean;
  session?: {
    userId: string;
    isLoggedIn: boolean;
    lastActivity: string;
    applicationProgress: string;
    currentQuestionIndex: number;
    totalQuestions: number;
  } | null;
}

class SessionService {
  private sessionId: string | null = null;
  private websocket: WebSocket | null = null;
  private onProgressUpdate: ((progress: string) => void) | null = null;
  private onQuestionUpdate: ((question: any) => void) | null = null;
  private onApplicationCompleted: ((data: any) => void) | null = null;
  private onBrowserPortalUpdate: ((data: any) => void) | null = null;
  private lastProgressMessage: string | null = null;
  private lastProgressTime: number = 0;

  async startSession(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚀 Starting session...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No authenticated user found');
        return { success: false, error: 'User not authenticated' };
      }

      const userId = user.id;
      console.log('👤 User ID:', userId);

      // Start session on backend - let the backend handle credential retrieval and decryption
      const backendUrl = getBackendEndpoint('/api/session/start');
      console.log('🌐 Backend URL:', backendUrl);
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      console.log('📡 Backend response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.log('❌ Backend error:', error);
        return { success: false, error: error.error || 'Failed to start session' };
      }

      const responseData = await response.json();
      console.log('✅ Backend session started:', responseData);

      this.sessionId = userId;
      console.log('🔗 Session ID set to:', this.sessionId);

      // Connect WebSocket
      console.log('🔌 Connecting WebSocket...');
      await this.connectWebSocket();
      console.log('✅ WebSocket connected successfully');

      return { success: true };
    } catch (error) {
      console.error('❌ Error starting session:', error);
      return { success: false, error: 'Failed to start session' };
    }
  }



  async stopSession(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.sessionId) {
        return { success: false, error: 'No active session' };
      }

      // Stop session on backend
      const response = await fetch(getBackendEndpoint('/api/session/stop'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: this.sessionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to stop session' };
      }

      // Close WebSocket
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }

      this.sessionId = null;
      return { success: true };
    } catch (error) {
      console.error('Error stopping session:', error);
      return { success: false, error: 'Failed to stop session' };
    }
  }

  async getSessionStatus(): Promise<SessionStatus> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { isActive: false };
      }

      const response = await fetch(getBackendEndpoint(`/api/session/status/${user.id}`));
      if (!response.ok) {
        return { isActive: false };
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting session status:', error);
      return { isActive: false };
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use the same host as the backend URL but with ws:// protocol
      const backendUrl = getBackendUrl();
      const wsUrl = backendUrl.replace('https://', 'wss://').replace('http://', 'ws://');
      
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      console.log('🔌 Backend URL:', backendUrl);
      
      try {
        this.websocket = new WebSocket(wsUrl);
        console.log('🔌 WebSocket object created');
      } catch (error) {
        console.error('❌ Error creating WebSocket:', error);
        reject(error);
        return;
      }

      this.websocket.onopen = () => {
        console.log('🔌 WebSocket connected, sending session connect message');
        console.log('🔌 Session ID:', this.sessionId);
        this.websocket!.send(JSON.stringify({
          type: 'session_connect',
          userId: this.sessionId
        }));
        console.log('📤 Session connect message sent');
        resolve();
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📤 Received WebSocket message:', data);

          if (data.type === 'session_connected') {
            console.log('🔐 Session connected successfully');
          } else if (data.type === 'session_error') {
            console.error('❌ Session error:', data.error);
          } else if (data.type === 'progress') {
            console.log('📊 Progress update:', data.data);
            
            // Prevent duplicate progress messages within 100ms
            const now = Date.now();
            if (this.lastProgressMessage === data.data && (now - this.lastProgressTime) < 100) {
              console.log('⏭️ Skipping duplicate progress message:', data.data);
              return;
            }
            
            this.lastProgressMessage = data.data;
            this.lastProgressTime = now;
            
            if (this.onProgressUpdate) {
              this.onProgressUpdate(data.data);
            }
          } else if (data.type === 'question') {
            console.log('❓ Question received:', data.data);
            if (this.onQuestionUpdate) {
              this.onQuestionUpdate(data.data);
            }
          } else if (data.type === 'application_completed') {
            console.log('✅ Application completed:', data.data);
            if (this.onApplicationCompleted) {
              this.onApplicationCompleted(data.data);
            }
          } else if (data.type === 'application_error') {
            console.log('❌ Application error:', data.data);
            if (this.onApplicationCompleted) {
              this.onApplicationCompleted(data.data);
            }
          } else if (data.type === 'browser_portal_ready') {
            console.log('🖥️ Browser portal ready:', data.message);
            if (this.onBrowserPortalUpdate) {
              this.onBrowserPortalUpdate(data);
            }
            if (this.onProgressUpdate) {
              this.onProgressUpdate(`browser_portal_ready: ${data.message}`);
            }
          } else if (data.type === 'browser_portal_closed') {
            console.log('🖥️ Browser portal closed:', data.message);
            if (this.onBrowserPortalUpdate) {
              this.onBrowserPortalUpdate(data);
            }
            if (this.onProgressUpdate) {
              this.onProgressUpdate(`browser_portal_closed: ${data.message}`);
            }
          } else if (data.type === 'browser_screenshot') {
            console.log('📸 Browser screenshot received');
            if (this.onBrowserPortalUpdate) {
              this.onBrowserPortalUpdate(data);
            }
            if (this.onProgressUpdate) {
              this.onProgressUpdate(`browser_screenshot: ${data.timestamp}`);
            }
          } else if (data.type === 'click_confirmed') {
            console.log('✅ Click confirmed:', data);
            if (this.onBrowserPortalUpdate) {
              this.onBrowserPortalUpdate(data);
            }
            if (this.onProgressUpdate) {
              this.onProgressUpdate(`click_confirmed: ${data.x},${data.y}`);
            }
          } else if (data.type === 'input_confirmed') {
            console.log('✅ Input confirmed:', data);
            if (this.onBrowserPortalUpdate) {
              this.onBrowserPortalUpdate(data);
            }
            if (this.onProgressUpdate) {
              this.onProgressUpdate(`input_confirmed: ${data.selector}`);
            }
          } else if (data.type === 'keypress_confirmed') {
            console.log('✅ Key press confirmed:', data);
            if (this.onBrowserPortalUpdate) {
              this.onBrowserPortalUpdate(data);
            }
            if (this.onProgressUpdate) {
              this.onProgressUpdate(`keypress_confirmed: ${data.key}`);
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.websocket.onerror = (error) => {
        console.error('❌ WebSocket connection error:', error);
        reject(error);
      };

      this.websocket.onclose = (event) => {
        console.log('🔌 WebSocket connection closed:', event.code, event.reason);
        // Reset session state when WebSocket disconnects
        this.sessionId = null;
        this.websocket = null;
        // Don't auto-reconnect to prevent multiple connections
        // The session will handle reconnection when needed
      };
    });
  }

  setProgressCallback(callback: ((progress: string) => void) | null) {
    // Clear any existing callback to prevent duplicates
    if (this.onProgressUpdate && callback) {
      console.log('🔄 Replacing existing progress callback to prevent duplicates');
    }
    this.onProgressUpdate = callback;
    
    // If setting a new callback, also check if we need to reset session state
    if (callback && !this.sessionId) {
      console.log('🔄 Progress callback set but no active session, resetting state');
      this.onProgressUpdate = null;
    }
  }

  setQuestionCallback(callback: ((question: any) => void) | null) {
    this.onQuestionUpdate = callback;
  }

  setApplicationCompletedCallback(callback: ((data: any) => void) | null) {
    this.onApplicationCompleted = callback;
  }

  setBrowserPortalCallback(callback: ((data: any) => void) | null) {
    this.onBrowserPortalUpdate = callback;
  }

  sendAnswer(answer: string): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'answer',
        answer
      }));
    }
  }

  isSessionActive(): boolean {
    return this.sessionId !== null && this.websocket?.readyState === WebSocket.OPEN;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}

export const sessionService = new SessionService(); 