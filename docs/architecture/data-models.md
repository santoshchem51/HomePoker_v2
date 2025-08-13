# Data Models

Based on the PRD requirements, the core data models for PokePot's money tracking functionality:

## Session Model

**Purpose:** Represents a single poker night session with players and transaction tracking

```typescript
interface Session {
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
```

**Relationships:**
- One-to-many with Player (session has multiple players)
- One-to-many with Transaction (session has multiple buy-ins/cash-outs)

## Player Model

**Purpose:** Represents individual participants in poker sessions for money tracking

```typescript
interface Player {
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
```

**Relationships:**
- Belongs-to Session (many players per session)
- One-to-many with Transaction (player has multiple transactions)
- Optional belongs-to PlayerProfile (for regular players)

## Transaction Model

**Purpose:** Records individual buy-in and cash-out events for financial tracking

```typescript
interface Transaction {
  id: string;
  sessionId: string;
  playerId: string;
  type: 'buy_in' | 'cash_out';
  amount: number;
  timestamp: Date;
  method: 'voice' | 'manual';
  isVoided: boolean;
  description?: string;
}
```

**Relationships:**
- Belongs-to Session (many transactions per session)
- Belongs-to Player (many transactions per player)

## PlayerProfile Model

**Purpose:** Stores regular player information for quick session setup

```typescript
interface PlayerProfile {
  id: string;
  name: string;
  preferredBuyIn: number;
  avatarPath?: string;
  gamesPlayed: number;
  lastPlayedAt: Date;
  createdAt: Date;
}
```

**Relationships:**
- One-to-many with Player (profile can be used in multiple sessions)
