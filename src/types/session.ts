/**
 * Session-related TypeScript type definitions for PokePot
 * Matches database schema and business logic requirements
 */

export interface Session {
  id: string;
  name: string;
  organizerId: string;
  status: 'created' | 'active' | 'completed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  totalPot: number;
  playerCount: number;
}

export interface CreateSessionRequest {
  name: string;
  organizerId: string;
}

export interface SessionState {
  session: Session;
  players: import('./player').Player[];
  canStart: boolean;
  canComplete: boolean;
}

export interface SessionSummary {
  id: string;
  name: string;
  status: Session['status'];
  playerCount: number;
  totalPot: number;
  createdAt: Date;
  duration?: number; // in minutes
}