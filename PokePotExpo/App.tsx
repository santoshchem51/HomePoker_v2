import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Mock data to demonstrate Epic 1 functionality
interface Player {
  id: string;
  name: string;
  balance: number;
  totalBuyIns: number;
  totalCashOuts: number;
}

interface Transaction {
  id: string;
  playerId: string;
  playerName: string;
  type: 'buy_in' | 'cash_out';
  amount: number;
  timestamp: Date;
}

interface Session {
  id: string;
  name: string;
  status: 'created' | 'active' | 'completed';
  totalPot: number;
  createdAt: Date;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [currentScreen, setCurrentScreen] = useState<'home' | 'session' | 'players' | 'transactions' | 'whatsapp' | 'create_session'>('home');
  const [newSessionName, setNewSessionName] = useState('');

  // Epic 1 Demo Functions

  const showCreateSession = () => {
    setNewSessionName('');
    setCurrentScreen('create_session');
  };

  const createSession = () => {
    const sessionName = newSessionName.trim() || 'Poker Session';
    
    // Reset all data for new session
    setPlayers([]);
    setTransactions([]);
    setSelectedPlayer(null);
    setTransactionAmount('');
    
    const newSession: Session = {
      id: 'session_' + Date.now(),
      name: sessionName,
      status: 'created',
      totalPot: 0,
      createdAt: new Date()
    };
    setSession(newSession);
    setCurrentScreen('session');
  };

  const addPlayer = () => {
    if (!newPlayerName.trim() || !session) return;
    
    // Check for duplicate names
    if (players.find(p => p.name.toLowerCase() === newPlayerName.trim().toLowerCase())) {
      Alert.alert('Error', 'Player with this name already exists');
      return;
    }
    
    const newPlayer: Player = {
      id: 'player_' + Date.now(),
      name: newPlayerName.trim(),
      balance: 0,
      totalBuyIns: 0,
      totalCashOuts: 0
    };
    
    setPlayers([...players, newPlayer]);
    setNewPlayerName('');
    Alert.alert('Success', `${newPlayer.name} added to session!`);
  };

  const removePlayer = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    Alert.alert(
      'Remove Player',
      `Remove ${player.name} from session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setPlayers(players.filter(p => p.id !== playerId));
            if (selectedPlayer === playerId) {
              setSelectedPlayer(null);
            }
            Alert.alert('Success', `${player.name} removed from session`);
          }
        }
      ]
    );
  };

  const startSession = () => {
    if (!session || players.length < 2) {
      Alert.alert('Error', 'Need at least 2 players to start');
      return;
    }
    setSession({...session, status: 'active'});
    Alert.alert('Success', 'Session started!');
  };

  const recordTransaction = (type: 'buy_in' | 'cash_out') => {
    if (!selectedPlayer || !transactionAmount || !session) return;
    
    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const player = players.find(p => p.id === selectedPlayer);
    if (!player) return;

    // Validate cash-out
    if (type === 'cash_out' && amount > player.balance) {
      Alert.alert('Error', 'Insufficient balance for cash-out');
      return;
    }

    const transaction: Transaction = {
      id: 'txn_' + Date.now(),
      playerId: selectedPlayer,
      playerName: player.name,
      type,
      amount,
      timestamp: new Date()
    };

    // Update player balance
    const updatedPlayers = players.map(p => {
      if (p.id === selectedPlayer) {
        return {
          ...p,
          balance: type === 'buy_in' ? p.balance + amount : p.balance - amount,
          totalBuyIns: type === 'buy_in' ? p.totalBuyIns + amount : p.totalBuyIns,
          totalCashOuts: type === 'cash_out' ? p.totalCashOuts + amount : p.totalCashOuts
        };
      }
      return p;
    });

    // Update session total pot
    const newTotalPot = type === 'buy_in' ? session.totalPot + amount : session.totalPot - amount;

    setPlayers(updatedPlayers);
    setTransactions([transaction, ...transactions]);
    setSession({...session, totalPot: newTotalPot});
    setTransactionAmount('');
    
    Alert.alert('Success', `${type === 'buy_in' ? 'Buy-in' : 'Cash-out'} recorded for ${player.name}`);
  };

  const generateWhatsAppMessage = () => {
    if (!session || players.length === 0) return '';
    
    let message = `🎯 Poker Night Results - ${session.name}\n`;
    message += `💰 Total Pot: $${session.totalPot.toFixed(2)}\n\n`;
    message += `👥 Player Summary:\n`;
    
    players.forEach(player => {
      const netPosition = player.totalCashOuts - player.totalBuyIns;
      const sign = netPosition >= 0 ? '+' : '';
      message += `• ${player.name}: $${player.totalBuyIns.toFixed(0)} in → $${player.totalCashOuts.toFixed(0)} out = ${sign}$${netPosition.toFixed(0)}\n`;
    });
    
    message += '\n🔗 Shared via PokePot (Epic 1 Demo)';
    return message;
  };

  const completeSession = () => {
    if (!session) return;
    setSession({...session, status: 'completed'});
    Alert.alert('Session Complete', 'Session has been completed! Data cleanup will occur automatically in 10 hours.');
  };

  // UI Rendering
  const renderHome = () => (
    <View style={styles.screen}>
      <Text style={styles.title}>🎰 PokePot</Text>
      <Text style={styles.subtitle}>Poker Session Manager</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Welcome to PokePot!</Text>
        <Text style={styles.welcomeText}>Manage your poker sessions with ease. Track buy-ins, cash-outs, and share results with your friends.</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={showCreateSession}>
        <Text style={styles.buttonText}>Create New Session</Text>
      </TouchableOpacity>

      {session && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Session:</Text>
          <Text style={styles.sessionInfo}>
            {session.name} ({session.status})
          </Text>
          <Text style={styles.sessionInfo}>
            Players: {players.length} | Total Pot: ${session.totalPot.toFixed(2)}
          </Text>
          
          {session.status === 'completed' ? (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setCurrentScreen('session')}>
              <Text style={styles.buttonText}>View Session Details</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.successButton} onPress={() => setCurrentScreen('session')}>
              <Text style={styles.buttonText}>Continue Session</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <StatusBar style="auto" />
    </View>
  );

  const renderSession = () => (
    <View style={styles.screen}>
      <Text style={styles.title}>Session: {session?.name}</Text>
      <Text style={styles.sessionStatus}>Status: {session?.status} | Pot: ${session?.totalPot.toFixed(2)}</Text>
      
      <View style={styles.navButtons}>
        <TouchableOpacity style={styles.navButton} onPress={() => setCurrentScreen('players')}>
          <Text style={styles.navButtonText}>Players ({players.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => setCurrentScreen('transactions')}>
          <Text style={styles.navButtonText}>Transactions ({transactions.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => setCurrentScreen('whatsapp')}>
          <Text style={styles.navButtonText}>WhatsApp Share</Text>
        </TouchableOpacity>
      </View>

      {session?.status === 'created' && players.length >= 2 && (
        <TouchableOpacity style={styles.successButton} onPress={startSession}>
          <Text style={styles.buttonText}>Start Session</Text>
        </TouchableOpacity>
      )}

      {session?.status === 'active' && (
        <TouchableOpacity style={styles.warningButton} onPress={completeSession}>
          <Text style={styles.buttonText}>Complete Session</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.secondaryButton} onPress={() => setCurrentScreen('home')}>
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPlayers = () => (
    <View style={styles.screen}>
      <Text style={styles.title}>Player Management</Text>
      
      {session?.status === 'created' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Player:</Text>
          <TextInput
            style={styles.input}
            placeholder="Player Name"
            value={newPlayerName}
            onChangeText={setNewPlayerName}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={addPlayer}>
            <Text style={styles.buttonText}>Add Player</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.playersList}>
        {players.map(player => (
          <View key={player.id} style={styles.playerCardContainer}>
            <TouchableOpacity
              style={[styles.playerCard, selectedPlayer === player.id && styles.selectedPlayer]}
              onPress={() => setSelectedPlayer(player.id)}
            >
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerBalance}>Balance: ${player.balance.toFixed(2)}</Text>
              <Text style={styles.playerStats}>
                Buy-ins: ${player.totalBuyIns.toFixed(2)} | Cash-outs: ${player.totalCashOuts.toFixed(2)}
              </Text>
            </TouchableOpacity>
            {session?.status === 'created' && (
              <TouchableOpacity 
                style={styles.removeButton} 
                onPress={() => removePlayer(player.id)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {session?.status === 'active' && selectedPlayer && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Record Transaction:</Text>
          <TextInput
            style={styles.input}
            placeholder="Amount"
            value={transactionAmount}
            onChangeText={setTransactionAmount}
            keyboardType="numeric"
          />
          <View style={styles.transactionButtons}>
            <TouchableOpacity style={styles.buyInButton} onPress={() => recordTransaction('buy_in')}>
              <Text style={styles.buttonText}>Buy In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cashOutButton} onPress={() => recordTransaction('cash_out')}>
              <Text style={styles.buttonText}>Cash Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.secondaryButton} onPress={() => setCurrentScreen('session')}>
        <Text style={styles.buttonText}>Back to Session</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTransactions = () => (
    <View style={styles.screen}>
      <Text style={styles.title}>Transaction History</Text>
      
      <ScrollView style={styles.transactionsList}>
        {transactions.map(txn => (
          <View key={txn.id} style={styles.transactionCard}>
            <Text style={styles.transactionPlayer}>{txn.playerName}</Text>
            <Text style={[styles.transactionType, txn.type === 'buy_in' ? styles.buyIn : styles.cashOut]}>
              {txn.type === 'buy_in' ? '+' : '-'}${txn.amount.toFixed(2)} ({txn.type.replace('_', ' ')})
            </Text>
            <Text style={styles.transactionTime}>
              {txn.timestamp.toLocaleTimeString()}
            </Text>
          </View>
        ))}
        {transactions.length === 0 && (
          <Text style={styles.emptyMessage}>No transactions yet</Text>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => setCurrentScreen('session')}>
        <Text style={styles.buttonText}>Back to Session</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWhatsApp = () => (
    <View style={styles.screen}>
      <Text style={styles.title}>WhatsApp Share</Text>
      
      <ScrollView style={styles.messagePreview}>
        <Text style={styles.whatsappMessage}>{generateWhatsAppMessage()}</Text>
      </ScrollView>

      <TouchableOpacity 
        style={styles.whatsappButton} 
        onPress={() => Alert.alert('WhatsApp Share', 'Message copied to clipboard!\n\n(In real app, this opens WhatsApp)')}
      >
        <Text style={styles.buttonText}>📱 Share via WhatsApp</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => setCurrentScreen('session')}>
        <Text style={styles.buttonText}>Back to Session</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCreateSession = () => (
    <View style={styles.screen}>
      <Text style={styles.title}>Create New Session</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter session name (e.g., Friday Night Poker)"
          value={newSessionName}
          onChangeText={setNewSessionName}
          maxLength={50}
        />
        <Text style={styles.helpText}>Leave blank for default name "Poker Session"</Text>
      </View>

      <TouchableOpacity style={styles.successButton} onPress={createSession}>
        <Text style={styles.buttonText}>Create Session</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => setCurrentScreen('home')}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  // Main render
  switch (currentScreen) {
    case 'home': return renderHome();
    case 'create_session': return renderCreateSession();
    case 'session': return renderSession();
    case 'players': return renderPlayers();
    case 'transactions': return renderTransactions();
    case 'whatsapp': return renderWhatsApp();
    default: return renderHome();
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  feature: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 5,
  },
  sessionInfo: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  sessionStatus: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#666',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  successButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  warningButton: {
    backgroundColor: '#FF9800',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  navButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  navButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    margin: 5,
    flex: 1,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  playersList: {
    flex: 1,
    marginBottom: 20,
  },
  playerCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPlayer: {
    borderColor: '#2196F3',
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  playerBalance: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  playerStats: {
    fontSize: 14,
    color: '#666',
  },
  transactionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  buyInButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  cashOutButton: {
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  transactionsList: {
    flex: 1,
    marginBottom: 20,
  },
  transactionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  transactionPlayer: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyIn: {
    color: '#4CAF50',
  },
  cashOut: {
    color: '#F44336',
  },
  transactionTime: {
    fontSize: 12,
    color: '#666',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 50,
  },
  messagePreview: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    maxHeight: 300,
  },
  whatsappMessage: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  playerCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  removeButton: {
    backgroundColor: '#F44336',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 5,
  },
});
