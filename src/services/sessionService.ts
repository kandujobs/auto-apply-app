import { supabase } from '../supabaseClient';
import { getBackendEndpoint, getBackendUrl } from '../utils/backendUrl';

export interface SessionStatus {
  isActive: boolean;
  sessionActive?: boolean;
  browserRunning?: boolean;
  isLoggedIn?: boolean;
  applicationProgress?: string;
  currentQuestion?: any;
  totalQuestions?: number;
  lastActivity?: string;
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
  private onCheckpointPortalUpdate: ((data: any) => void) | null = null;
  private onSessionStatusUpdate: ((status: SessionStatus) => void) | null = null;
  private onJobFetchCompleted: ((data: any) => void) | null = null;
  private lastProgressMessage: string | null = null;
  private lastProgressTime: number = 0;
  private connectionPromise: Promise<void> | null = null;

  async startSession(): Promise<{ success: boolean; error?: string }> {
    console.log('🚀 [START] startSession method called - BEGINNING');
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No authenticated user found');
        return { success: false, error: 'User not authenticated' };
      }

      const userId = user.id;
      console.log('👤 User ID:', userId);

      // Start session on backend
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

      let responseData;
      try {
        responseData = await response.json();
        console.log('✅ Backend session started:', responseData);
      } catch (error) {
        console.log('⚠️ Response is not JSON, but status is OK. Response text:', await response.text());
        responseData = { success: true };
      }

      // Set session ID first
      this.sessionId = userId;
      console.log('🔗 Session ID set to:', this.sessionId);

      // Connect WebSocket with retry logic
      console.log('🔌 About to call connectWebSocket()...');
      let connectionAttempts = 0;
      const maxAttempts = 3;
      
      while (connectionAttempts < maxAttempts) {
        try {
          await this.connectWebSocket();
          console.log('✅ WebSocket connected successfully on attempt', connectionAttempts + 1);
          break;
        } catch (error) {
          connectionAttempts++;
          console.error(`❌ WebSocket connection attempt ${connectionAttempts} failed:`, error);
          
          if (connectionAttempts >= maxAttempts) {
            console.error('❌ All WebSocket connection attempts failed');
            return { success: false, error: 'Failed to establish WebSocket connection' };
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * connectionAttempts));
        }
      }

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
      this.connectionPromise = null;
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
    console.log('🔌 [CONNECT] Starting connectWebSocket method...');
    
    // If already connecting, wait for that connection
    if (this.connectionPromise) {
      console.log('🔌 [CONNECT] Already connecting, waiting for existing connection...');
      return this.connectionPromise;
    }
    
    // If already connected, return immediately
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      console.log('🔌 [CONNECT] WebSocket already connected');
      return;
    }
    
    // Close existing connection if any
    if (this.websocket) {
      console.log('🔌 [CONNECT] Closing existing WebSocket connection...');
      this.websocket.close();
      this.websocket = null;
    }
    
    this.connectionPromise = new Promise((resolve, reject) => {
      console.log('🔌 [CONNECT] Creating new WebSocket connection...');
      
      const backendUrl = getBackendUrl();
      const wsUrl = backendUrl.replace('https://', 'wss://').replace('http://', 'ws://');
      
      console.log('🔌 [CONNECT] WebSocket URL:', wsUrl);
      
      try {
        this.websocket = new WebSocket(wsUrl);
        console.log('🔌 [CONNECT] WebSocket object created');
      } catch (error) {
        console.error('❌ [CONNECT] Error creating WebSocket:', error);
        this.connectionPromise = null;
        reject(error);
        return;
      }

      // Set up event handlers
      this.websocket.onopen = () => {
        console.log('🔌 [CONNECT] WebSocket opened successfully!');
        console.log('🔌 [CONNECT] WebSocket readyState:', this.websocket?.readyState);
        console.log('🔌 [CONNECT] Sending session_connect message...');
        
        if (!this.sessionId) {
          console.error('❌ [CONNECT] No session ID available');
          this.connectionPromise = null;
          reject(new Error('No session ID available'));
          return;
        }
        
        try {
          const connectMessage = {
            type: 'session_connect',
            userId: this.sessionId
          };
          console.log('📤 [CONNECT] Sending message:', connectMessage);
          this.websocket!.send(JSON.stringify(connectMessage));
          console.log('📤 [CONNECT] Session connect message sent successfully');
        } catch (error) {
          console.error('❌ [CONNECT] Error sending session connect message:', error);
          this.connectionPromise = null;
          reject(error);
        }
      };

      this.websocket.onerror = (error) => {
        console.error('❌ [CONNECT] WebSocket error:', error);
        console.error('❌ [CONNECT] WebSocket readyState:', this.websocket?.readyState);
        this.connectionPromise = null;
        reject(new Error('WebSocket connection error'));
      };

      this.websocket.onclose = (event) => {
        console.log('🔌 [CONNECT] WebSocket closed:', event.code, event.reason);
        console.log('🔌 [CONNECT] WebSocket wasClean:', event.wasClean);
        if (!event.wasClean) {
          this.connectionPromise = null;
          reject(new Error(`WebSocket connection closed unexpectedly: ${event.code} ${event.reason}`));
        }
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📥 [CONNECT] Received message:', data);

          if (data.type === 'session_status') {
            console.log('✅ [CONNECT] Session status received:', data);
            
            // Call session status callback if set
            if (this.onSessionStatusUpdate) {
              this.onSessionStatusUpdate({
                isActive: data.status === 'active',
                sessionActive: data.status === 'active',
                browserRunning: data.isBrowserRunning,
                session: {
                  userId: this.sessionId || '',
                  isLoggedIn: data.isBrowserRunning,
                  lastActivity: new Date().toISOString(),
                  applicationProgress: data.applicationProgress || '',
                  currentQuestionIndex: data.currentQuestion || 0,
                  totalQuestions: data.totalQuestions || 0
                }
              });
            }
            
            // Only resolve the connection promise if status is 'active'
            // If status is 'waiting', we'll wait for the next status update
            if (data.status === 'active') {
              this.connectionPromise = null;
              resolve();
            } else if (data.status === 'waiting') {
              console.log('⏳ [CONNECT] Session is waiting, not resolving connection promise yet');
            }
          } else if (data.type === 'error') {
            console.error('❌ [CONNECT] Session error:', data.message);
            this.connectionPromise = null;
            reject(new Error(data.message));
          } else if (data.type === 'progress') {
            console.log('📊 [CONNECT] Progress update:', data.data);
            
            // Prevent duplicate progress messages within 100ms
            const now = Date.now();
            if (this.lastProgressMessage === data.data && (now - this.lastProgressTime) < 100) {
              return;
            }
            
            this.lastProgressMessage = data.data;
            this.lastProgressTime = now;
            
            if (this.onProgressUpdate) {
              this.onProgressUpdate(data.data);
            }
          } else if (data.type === 'question') {
            console.log('❓ [CONNECT] Question received:', data.data);
            if (this.onQuestionUpdate) {
              this.onQuestionUpdate(data.data);
            }
          } else if (data.type === 'application_completed') {
            console.log('✅ [CONNECT] Application completed:', data.data);
            if (this.onApplicationCompleted) {
              this.onApplicationCompleted(data.data);
            }
          } else if (data.type === 'application_error') {
            console.log('❌ [CONNECT] Application error:', data.data);
            if (this.onApplicationCompleted) {
              this.onApplicationCompleted(data.data);
            }
          } else if (data.type === 'checkpoint_portal_ready') {
            console.log('🖥️ [CONNECT] Checkpoint portal ready:', data.message);
            if (this.onCheckpointPortalUpdate) {
              this.onCheckpointPortalUpdate(data);
            }
            if (this.onProgressUpdate) {
              this.onProgressUpdate(`checkpoint_portal_ready: ${data.message}`);
            }
          } else if (data.type === 'checkpoint_portal_completed') {
            console.log('🖥️ [CONNECT] Checkpoint portal completed:', data.message);
            if (this.onCheckpointPortalUpdate) {
              this.onCheckpointPortalUpdate(data);
            }
            if (this.onProgressUpdate) {
              this.onProgressUpdate(`checkpoint_portal_completed: ${data.message}`);
            }
          } else if (data.type === 'checkpoint_portal_closed') {
            console.log('🖥️ [CONNECT] Checkpoint portal closed:', data.message);
            if (this.onCheckpointPortalUpdate) {
              this.onCheckpointPortalUpdate(data);
            }
            if (this.onProgressUpdate) {
              this.onProgressUpdate(`checkpoint_portal_closed: ${data.message}`);
            }
          }
        } catch (error) {
          console.error('❌ [CONNECT] Error parsing WebSocket message:', error);
        }
      };

      this.websocket.onerror = (error) => {
        console.error('❌ [CONNECT] WebSocket error:', error);
        this.connectionPromise = null;
        reject(error);
      };

      this.websocket.onclose = (event) => {
        console.log('🔌 [CONNECT] WebSocket closed:', event.code, event.reason);
        this.websocket = null;
        this.connectionPromise = null;
        
        // Reset session state when WebSocket disconnects
        if (this.sessionId) {
          console.log('🔌 [CONNECT] Resetting session state due to WebSocket closure');
          this.sessionId = null;
        }
      };

      // Set a timeout for the connection
      setTimeout(() => {
        if (this.connectionPromise) {
          console.error('❌ [CONNECT] WebSocket connection timeout');
          this.connectionPromise = null;
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000); // 10 second timeout
    });

    return this.connectionPromise;
  }

  setProgressCallback(callback: ((progress: string) => void) | null) {
    this.onProgressUpdate = callback;
  }

  setQuestionCallback(callback: ((question: any) => void) | null) {
    this.onQuestionUpdate = callback;
  }

  setApplicationCompletedCallback(callback: ((data: any) => void) | null) {
    this.onApplicationCompleted = callback;
  }

  setCheckpointPortalCallback(callback: ((data: any) => void) | null) {
    this.onCheckpointPortalUpdate = callback;
  }

  setSessionStatusCallback(callback: ((status: SessionStatus) => void) | null) {
    this.onSessionStatusUpdate = callback;
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