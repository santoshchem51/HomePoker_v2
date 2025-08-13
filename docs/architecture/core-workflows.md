# Core Workflows

Key system workflows using sequence diagrams to illustrate critical user journeys and component interactions:

## Workflow 1: Session Creation and Player Onboarding

```mermaid
sequenceDiagram
    participant U as User/Organizer
    participant UI as UI Layer
    participant SM as SessionManager
    participant DB as DatabaseManager
    participant QR as QRGenerator
    
    U->>UI: Create new poker session
    UI->>SM: createSession(name, organizerId)
    SM->>DB: INSERT INTO sessions
    DB-->>SM: session created
    SM-->>UI: Session object
    
    loop Add Players (4-8)
        U->>UI: Add player (name, isGuest)
        UI->>SM: addPlayer(sessionId, playerData)
        SM->>DB: INSERT INTO players
        DB-->>SM: player created
        SM-->>UI: Player added
    end
    
    U->>UI: Start session
    UI->>SM: startSession(sessionId)
    SM->>DB: UPDATE session status = 'active'
    SM->>QR: generateQRCode(sessionId)
    QR-->>SM: QR code data
    SM-->>UI: Session active + QR code
    UI-->>U: Live game dashboard ready
```

## Workflow 2: Voice-Enabled Transaction Recording

```mermaid
sequenceDiagram
    participant U as User
    participant UI as UI Layer
    participant VC as VoiceCommandHandler
    participant TP as TransactionProcessor
    participant SM as SessionManager
    participant DB as DatabaseManager
    
    U->>UI: Press voice activation button
    UI->>VC: startListening()
    VC->>VC: Activate device speech recognition
    VC-->>UI: Listening state active
    
    U->>VC: "Add John fifty dollars"
    VC->>VC: Process voice input
    VC->>SM: getSessionPlayers(sessionId)
    SM-->>VC: Player list
    VC->>VC: parsePlayerName("John", players)
    VC->>VC: parseAmount("fifty dollars")
    
    VC-->>UI: Command parsed: {player: "John", amount: 50, type: "buy_in"}
    UI-->>U: Confirmation dialog
    U->>UI: Confirm transaction
    
    UI->>TP: recordBuyIn(playerId, 50, "voice")
    TP->>DB: BEGIN TRANSACTION
    TP->>DB: INSERT INTO transactions
    TP->>DB: UPDATE player balance
    TP->>DB: UPDATE session total_pot
    TP->>DB: COMMIT
    DB-->>TP: Transaction successful
    
    TP-->>UI: Transaction recorded
    UI-->>U: Success celebration + updated balance
```

## Workflow 3: Settlement Optimization

```mermaid
sequenceDiagram
    participant U as Organizer
    participant UI as UI Layer
    participant SE as SettlementEngine
    participant TP as TransactionProcessor
    participant WA as WhatsAppIntegration
    participant DB as DatabaseManager
    
    U->>UI: End game session
    UI->>SE: optimizeFinalSettlement(sessionId)
    
    SE->>TP: getAllPlayerBalances(sessionId)
    TP->>DB: SELECT all players + transactions
    DB-->>TP: Complete session data
    TP-->>SE: Player net positions
    
    SE->>SE: Run settlement optimization algorithm
    Note over SE: Minimize total payment transactions<br/>Algorithm completes within 2 seconds
    
    SE->>SE: validateSettlement(optimizedPlan)
    SE-->>UI: OptimizedSettlement {payments[], savings}
    
    UI-->>U: Settlement plan (X payments instead of Y)
    U->>UI: Share to WhatsApp
    
    UI->>WA: formatSettlementMessage(settlement, "detailed")
    WA-->>UI: Formatted message
    UI->>WA: shareToWhatsApp(message)
    WA->>WA: Launch WhatsApp with message
    WA-->>UI: Share initiated
    
    UI->>SE: completeSession(sessionId)
    SE->>DB: UPDATE session status = 'completed'
    SE-->>UI: Session completed
    
    UI-->>U: Game ended + cleanup scheduled
```
