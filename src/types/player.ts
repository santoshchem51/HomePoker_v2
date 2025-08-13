/**
 * Player-related TypeScript type definitions for PokePot
 * Matches database schema and business logic requirements
 */

export interface Player {
  id: string;
  sessionId: string;
  name: string;
  isGuest: boolean;
  profileId?: string;
  currentBalance: number;
  totalBuyIns: number;
  totalCashOuts: number;
  status: 'active' | 'cashed_out';
  joinedAt: Date;
}

export interface CreatePlayerRequest {
  sessionId: string;
  name: string;
  isGuest?: boolean;
  profileId?: string;
}

export interface PlayerData {
  name: string;
  isGuest?: boolean;
  profileId?: string;
}

export interface PlayerSummary {
  id: string;
  name: string;
  currentBalance: number;
  status: Player['status'];
  joinedAt: Date;
}