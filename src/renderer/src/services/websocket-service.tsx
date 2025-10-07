/* eslint-disable no-use-before-define */
import { Subject } from 'rxjs';
import { ModelInfo } from '@/context/live2d-config-context';
import { HistoryInfo } from '@/context/websocket-context';
import { ConfigFile } from '@/context/character-config-context';
import { errorHandler } from '@/utils/error-handler';

export interface DisplayText {
  text: string;
  name: string;
  avatar: string;
}

interface BackgroundFile {
  name: string;
  url: string;
}

export interface AudioPayload {
  type: 'audio';
  audio?: string;
  volumes?: number[];
  slice_length?: number;
  display_text?: DisplayText;
  actions?: Actions;
}

export interface Message {
  id: string;
  content: string;
  role: "ai" | "human";
  timestamp: string;
  name?: string;
  avatar?: string;
}

export interface Actions {
  expressions?: string[] | number [];
  pictures?: string[];
  sounds?: string[];
}

export interface MessageEvent {
  type: string;
  audio?: string;
  volumes?: number[];
  slice_length?: number;
  files?: BackgroundFile[];
  actions?: Actions;
  text?: string;
  model_info?: ModelInfo;
  conf_name?: string;
  conf_uid?: string;
  uids?: string[];
  messages?: Message[];
  history_uid?: string;
  success?: boolean;
  histories?: HistoryInfo[];
  configs?: ConfigFile[];
  message?: string;
  members?: string[];
  is_owner?: boolean;
  client_uid?: string;
  forwarded?: boolean;
  display_text?: DisplayText;
  
  // 洗衣机视频相关字段
  video_path?: string;
  machine_id?: string;
  video_name?: string;
  auto_close?: boolean;
  machines?: any[];
  
  // 唤醒词相关字段
  action?: string;
  matched_word?: string;
  language?: string;
  current_state?: string;
  stats?: any;
  advertisement_control?: any;
  
  // MCP工具相关字段
  tool_name?: string;
  result?: any[];
  error?: string;
}

class WebSocketService {
  private static instance: WebSocketService;

  private ws: WebSocket | null = null;

  private messageSubject = new Subject<MessageEvent>();

  private stateSubject = new Subject<'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED'>();

  private currentState: 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' = 'CLOSED';

  // ===== Reconnect & Heartbeat =====
  private lastUrl: string | null = null;

  private shouldReconnect = true;

  private reconnectAttempts = 0;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  private heartbeatWatchdog: ReturnType<typeof setInterval> | null = null;

  private lastHeartbeatAckTs = 0;

  // 延迟连接的定时器，用于在旧连接清理后重连
  private delayedConnectTimer: ReturnType<typeof setTimeout> | null = null;

  // Queue user/control messages while WS is not OPEN
  private outbox: object[] = [];

  static getInstance() {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private initializeConnection() {
    this.sendMessage({
      type: 'fetch-backgrounds',
    });
    this.sendMessage({
      type: 'fetch-configs',
    });
    this.sendMessage({
      type: 'fetch-history-list',
    });
    this.sendMessage({
      type: 'create-new-history',
    });
  }

  private startHeartbeat() {
    this.lastHeartbeatAckTs = Date.now();

    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.debug('🩺 WS heartbeat -> ping');
        this.sendMessage({ type: 'heartbeat' });
      }
    }, 10000); // every 10s

    if (this.heartbeatWatchdog) clearInterval(this.heartbeatWatchdog);
    this.heartbeatWatchdog = setInterval(() => {
      const now = Date.now();
      if (this.currentState === 'OPEN' && now - this.lastHeartbeatAckTs > 90000) {
        // 90s 未收到 ack 视为断线
        console.warn('🩺 WS heartbeat timeout (>30s no ack). Closing to trigger reconnect...');
        try { this.ws?.close(); } catch {}
      }
    }, 5000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatWatchdog) {
      clearInterval(this.heartbeatWatchdog);
      this.heartbeatWatchdog = null;
    }
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect || !this.lastUrl) return;
    if (this.reconnectTimer) return;

    const delay = Math.min(15000, 1000 * Math.pow(2, this.reconnectAttempts));
    console.warn(`🔁 WS schedule reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts += 1;
      console.info('🔁 WS reconnecting...', { attempt: this.reconnectAttempts, url: this.lastUrl });
      this.connect(this.lastUrl!);
    }, delay);
  }

  connect(url: string) {
    // 清理任何待处理的延迟连接
    if (this.delayedConnectTimer) {
      clearTimeout(this.delayedConnectTimer);
      this.delayedConnectTimer = null;
    }

    // 如果已经连接到相同的URL且连接正常，不重复连接
    if (this.lastUrl === url && 
        (this.ws?.readyState === WebSocket.CONNECTING || this.ws?.readyState === WebSocket.OPEN)) {
      console.warn('🔄 WS already connecting/connected to', url, '- skipping duplicate connect');
      return;
    }

    // 如果有旧连接，先彻底清理
    if (this.ws) {
      console.info('🔄 WS closing existing connection before reconnect');
      this.disconnect();
      // 给一个短暂的延迟确保旧连接完全关闭
      this.delayedConnectTimer = setTimeout(() => {
        this.delayedConnectTimer = null;
        this._doConnect(url);
      }, 100);
      return;
    }

    this._doConnect(url);
  }

  private _doConnect(url: string) {
    try {
      this.shouldReconnect = true;
      this.lastUrl = url;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      console.info('🌐 WS connecting...', url);
      this.ws = new WebSocket(url);
      this.currentState = 'CONNECTING';
      this.stateSubject.next('CONNECTING');

      this.ws.onopen = () => {
        console.info('✅ WS open');
        this.currentState = 'OPEN';
        this.stateSubject.next('OPEN');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.initializeConnection();
        // Flush queued messages safely
        try {
          while (this.ws?.readyState === WebSocket.OPEN && this.outbox.length > 0) {
            const msg = this.outbox.shift();
            if (msg) this.ws.send(JSON.stringify(msg));
          }
        } catch (e) {
          console.warn('Failed to flush WS outbox:', e);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message?.type === 'heartbeat-ack') {
            this.lastHeartbeatAckTs = Date.now();
            console.debug('🩺 WS heartbeat <- ack');
            return;
          }
          this.messageSubject.next(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          errorHandler.handleWebSocketError(
            error as Error, 
            'Message parsing failed'
          );
        }
      };

      this.ws.onclose = (event) => {
        console.warn('🔌 WS closed:', { code: event.code, reason: event.reason, wasClean: event.wasClean });
        this.currentState = 'CLOSED';
        this.stateSubject.next('CLOSED');
        this.stopHeartbeat();
        
        if (!event.wasClean) {
          console.warn('🔌 WebSocket连接异常关闭:', event.code, event.reason);
          errorHandler.handleWebSocketError(
            new Error(`Connection closed unexpectedly: ${event.reason || event.code}`),
            'Connection lost'
          );
        }
        this.scheduleReconnect();
      };

      this.ws.onerror = (event) => {
        console.error('🚨 WS error event:', event);
        this.currentState = 'CLOSED';
        this.stateSubject.next('CLOSED');
        console.error('🚨 WebSocket连接错误:', event);
        this.stopHeartbeat();
        errorHandler.handleWebSocketError(
          new Error('WebSocket connection failed'),
          'Connection error'
        );
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.currentState = 'CLOSED';
      this.stateSubject.next('CLOSED');
      errorHandler.handleWebSocketError(
        error as Error,
        'Connection initialization failed'
      );
      this.scheduleReconnect();
    }
  }

  sendMessage(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return;
    }
    // 对心跳消息静默处理；其余消息仍提示
    const isHeartbeat = message && message.type === 'heartbeat';
    if (isHeartbeat) {
      console.debug('WS not open. Skip heartbeat toast.');
      return;
    }
    // Queue and auto-resend when WS opens
    this.outbox.push(message);
    console.warn('WS not open. Queued message for resend after reconnect:', message);
    if (this.currentState === 'CLOSED' && this.lastUrl) {
      this.connect(this.lastUrl);
    }
  }

  onMessage(callback: (message: MessageEvent) => void) {
    const subscription = this.messageSubject.subscribe(callback);
    console.debug('📡 新消息订阅已创建');
    return subscription;
  }

  onStateChange(callback: (state: 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED') => void) {
    const subscription = this.stateSubject.subscribe(callback);
    console.debug('📡 新状态订阅已创建');
    return subscription;
  }
  
  // 获取订阅数量用于调试
  getSubscriptionCount() {
    return {
      message: this.messageSubject.observers.length,
      state: this.stateSubject.observers.length,
    };
  }

  disconnect() {
    console.info('🔚 WS manual disconnect - cleaning up all resources');
    this.shouldReconnect = false;
    this.stopHeartbeat();
    
    // 清理重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // 清理延迟连接定时器
    if (this.delayedConnectTimer) {
      clearTimeout(this.delayedConnectTimer);
      this.delayedConnectTimer = null;
    }
    
    // 清理WebSocket连接
    if (this.ws) {
      try {
        // 移除所有事件监听器，防止触发额外的重连
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onclose = null;
        this.ws.onerror = null;
        
        if (this.ws.readyState === WebSocket.OPEN || 
            this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
        }
      } catch (e) {
        console.warn('Error closing WebSocket:', e);
      }
      this.ws = null;
    }
    
    // 清空待发送消息队列
    this.outbox = [];
    
    // 更新状态
    this.currentState = 'CLOSED';
    this.stateSubject.next('CLOSED');
    
    console.info('✅ WS disconnect完成 - 所有资源已清理');
  }

  getCurrentState() {
    return this.currentState;
  }
}

export const wsService = WebSocketService.getInstance();
