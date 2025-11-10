/**
 * SocketService - Manages Socket.io connection and events
 */

import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
} from '@beruraid/shared';

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private readonly serverUrl: string;

  constructor() {
    this.serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
  }

  /**
   * Connect to the server
   */
  public connect(): void {
    if (this.socket?.connected) {
      console.log('Already connected');
      return;
    }

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.setupDefaultListeners();
  }

  /**
   * Disconnect from the server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Emit an event to the server
   */
  public emit(event: any, data?: unknown): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * Listen for an event from the server
   */
  public on(event: any, callback: (data: any) => void): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.on(event, callback);
  }

  /**
   * Remove a listener
   */
  public off(event: any, callback?: (data: any) => void): void {
    if (!this.socket) {
      return;
    }
    this.socket.off(event, callback);
  }

  /**
   * Setup default event listeners
   */
  private setupDefaultListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });
  }

  /**
   * Check if socket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   */
  public getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Create a new room
   */
  public createRoom(request: CreateRoomRequest): Promise<CreateRoomResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('room:create', request, (response) => {
        if (response.success) {
          console.log('🏠 Room created:', response.roomCode);
        } else {
          console.error('❌ Failed to create room:', response.error);
        }
        resolve(response);
      });
    });
  }

  /**
   * Join an existing room
   */
  public joinRoom(request: JoinRoomRequest): Promise<JoinRoomResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('room:join', request, (response) => {
        if (response.success) {
          console.log('👤 Joined room:', request.roomCode);
        } else {
          console.error('❌ Failed to join room:', response.error);
        }
        resolve(response);
      });
    });
  }

  /**
   * Leave current room
   */
  public leaveRoom(): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('room:leave');
    console.log('👋 Left room');
  }

  /**
   * Get socket instance (for advanced usage)
   */
  public getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }
}

// Export singleton instance
export const socketService = new SocketService();
