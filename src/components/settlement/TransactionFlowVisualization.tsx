/**
 * Transaction Flow Visualization Component - Epic 3: Settlement Optimization
 * Story 3.2: Settlement Plan Visualization Components
 * 
 * React Native component for visualizing payment flows with sender → receiver mappings
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import { PaymentPlan } from '../../types/settlement';

interface PlayerNode {
  playerId: string;
  playerName: string;
  totalIncoming: number;
  totalOutgoing: number;
  netPosition: number;
  position: { x: number; y: number };
  isDebtor: boolean;
  isCreditor: boolean;
}

interface FlowConnection {
  fromPlayer: PlayerNode;
  toPlayer: PlayerNode;
  amount: number;
  priority: number;
  thickness: number;
  color: string;
}

interface TransactionFlowVisualizationProps {
  payments: PaymentPlan[];
  title?: string;
  showAmounts?: boolean;
  showPriority?: boolean;
  enableInteraction?: boolean;
  highlightOptimalPath?: boolean;
  onPaymentSelect?: (payment: PaymentPlan) => void;
  onPlayerSelect?: (playerId: string) => void;
  accessibilityLabel?: string;
}

export const TransactionFlowVisualization: React.FC<TransactionFlowVisualizationProps> = ({
  payments,
  title = 'Transaction Flow',
  showAmounts = true,
  showPriority = false,
  enableInteraction = true,
  highlightOptimalPath = true,
  onPaymentSelect,
  onPlayerSelect,
  accessibilityLabel = 'Transaction Flow Visualization',
}) => {
  const { width, height } = Dimensions.get('window');
  const canvasWidth = width - 32; // Account for padding
  const canvasHeight = Math.max(400, height * 0.5);

  // Generate player nodes from payments
  const playerNodes = useMemo((): PlayerNode[] => {
    if (payments.length === 0) return [];

    // Collect all unique players
    const playerMap = new Map<string, {
      id: string;
      name: string;
      incoming: number;
      outgoing: number;
    }>();

    payments.forEach(payment => {
      // From player (outgoing)
      if (!playerMap.has(payment.fromPlayerId)) {
        playerMap.set(payment.fromPlayerId, {
          id: payment.fromPlayerId,
          name: payment.fromPlayerName,
          incoming: 0,
          outgoing: 0,
        });
      }
      const fromPlayer = playerMap.get(payment.fromPlayerId)!;
      fromPlayer.outgoing += payment.amount;

      // To player (incoming)
      if (!playerMap.has(payment.toPlayerId)) {
        playerMap.set(payment.toPlayerId, {
          id: payment.toPlayerId,
          name: payment.toPlayerName,
          incoming: 0,
          outgoing: 0,
        });
      }
      const toPlayer = playerMap.get(payment.toPlayerId)!;
      toPlayer.incoming += payment.amount;
    });

    // Convert to nodes with positions
    const players = Array.from(playerMap.values());
    const nodeCount = players.length;
    
    // Calculate positions in a circle for optimal layout
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = Math.min(canvasWidth, canvasHeight) * 0.35;

    return players.map((player, index) => {
      const angle = (2 * Math.PI * index) / nodeCount;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      const netPosition = player.incoming - player.outgoing;

      return {
        playerId: player.id,
        playerName: player.name,
        totalIncoming: player.incoming,
        totalOutgoing: player.outgoing,
        netPosition,
        position: { x, y },
        isDebtor: netPosition < 0,
        isCreditor: netPosition > 0,
      };
    });
  }, [payments, canvasWidth, canvasHeight]);

  // Generate flow connections
  const flowConnections = useMemo((): FlowConnection[] => {
    const nodeMap = new Map(playerNodes.map(node => [node.playerId, node]));
    
    return payments.map(payment => {
      const fromNode = nodeMap.get(payment.fromPlayerId)!;
      const toNode = nodeMap.get(payment.toPlayerId)!;
      
      // Calculate visual properties
      const maxAmount = Math.max(...payments.map(p => p.amount));
      const thickness = Math.max(2, (payment.amount / maxAmount) * 8);
      
      // Color based on priority and amount
      const isHighPriority = payment.priority <= 3;
      const isLargeAmount = payment.amount >= maxAmount * 0.7;
      
      let color = '#90A4AE'; // Default gray
      if (highlightOptimalPath) {
        if (isHighPriority && isLargeAmount) {
          color = '#4CAF50'; // Green for optimal
        } else if (isHighPriority || isLargeAmount) {
          color = '#FF9800'; // Orange for good
        }
      }

      return {
        fromPlayer: fromNode,
        toPlayer: toNode,
        amount: payment.amount,
        priority: payment.priority,
        thickness,
        color,
      };
    });
  }, [payments, playerNodes, highlightOptimalPath]);

  // Format currency helper
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  // Handle player selection
  const handlePlayerPress = useCallback((node: PlayerNode) => {
    if (!enableInteraction) return;
    
    AccessibilityInfo.announceForAccessibility(
      `Selected player ${node.playerName}, net position ${formatCurrency(node.netPosition)}`
    );
    
    onPlayerSelect?.(node.playerId);
  }, [enableInteraction, onPlayerSelect, formatCurrency]);

  // Handle payment selection
  const handlePaymentPress = useCallback((connection: FlowConnection) => {
    if (!enableInteraction) return;
    
    const payment = payments.find(p => 
      p.fromPlayerId === connection.fromPlayer.playerId && 
      p.toPlayerId === connection.toPlayer.playerId &&
      p.amount === connection.amount
    );
    
    if (payment) {
      AccessibilityInfo.announceForAccessibility(
        `Selected payment from ${connection.fromPlayer.playerName} to ${connection.toPlayer.playerName}, amount ${formatCurrency(connection.amount)}`
      );
      onPaymentSelect?.(payment);
    }
  }, [enableInteraction, payments, onPaymentSelect, formatCurrency]);

  // Calculate path for curved arrow
  const getConnectionPath = useCallback((connection: FlowConnection) => {
    const { fromPlayer, toPlayer } = connection;
    const dx = toPlayer.position.x - fromPlayer.position.x;
    const dy = toPlayer.position.y - fromPlayer.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate control points for curved path
    const midX = (fromPlayer.position.x + toPlayer.position.x) / 2;
    const midY = (fromPlayer.position.y + toPlayer.position.y) / 2;
    
    // Curve offset (perpendicular to the line)
    const offsetX = -dy / distance * 20; // 20px curve
    const offsetY = dx / distance * 20;
    
    return {
      startX: fromPlayer.position.x,
      startY: fromPlayer.position.y,
      controlX: midX + offsetX,
      controlY: midY + offsetY,
      endX: toPlayer.position.x,
      endY: toPlayer.position.y,
    };
  }, []);

  // Render player node
  const renderPlayerNode = useCallback((node: PlayerNode) => {
    const nodeSize = 60;
    const left = node.position.x - nodeSize / 2;
    const top = node.position.y - nodeSize / 2;
    
    const backgroundColor = node.isCreditor ? '#E8F5E8' : 
                          node.isDebtor ? '#FFEBEE' : 
                          '#F5F5F5';
    
    const borderColor = node.isCreditor ? '#4CAF50' : 
                       node.isDebtor ? '#F44336' : 
                       '#E0E0E0';

    return (
      <TouchableOpacity
        key={node.playerId}
        style={[
          styles.playerNode,
          {
            left,
            top,
            width: nodeSize,
            height: nodeSize,
            backgroundColor,
            borderColor,
          },
        ]}
        onPress={() => handlePlayerPress(node)}
        disabled={!enableInteraction}
        accessibilityRole="button"
        accessibilityLabel={`Player ${node.playerName}, ${node.isCreditor ? 'receives' : node.isDebtor ? 'pays' : 'neutral'} ${formatCurrency(Math.abs(node.netPosition))}`}
      >
        <Text style={styles.playerName} numberOfLines={2}>
          {node.playerName}
        </Text>
        <Text style={[
          styles.playerAmount,
          { color: node.isCreditor ? '#4CAF50' : node.isDebtor ? '#F44336' : '#666' }
        ]}>
          {node.netPosition !== 0 ? formatCurrency(Math.abs(node.netPosition)) : '—'}
        </Text>
      </TouchableOpacity>
    );
  }, [handlePlayerPress, enableInteraction, formatCurrency]);

  // Render connection arrow (simplified SVG-like approach)
  const renderConnection = useCallback((connection: FlowConnection, index: number) => {
    const path = getConnectionPath(connection);
    const { startX, startY, endX, endY } = path;
    
    // Calculate angle for arrow head
    const angle = Math.atan2(endY - startY, endX - startX);
    
    // Arrow length
    const arrowLength = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
    
    return (
      <TouchableOpacity
        key={`connection-${index}`}
        style={styles.connectionContainer}
        onPress={() => handlePaymentPress(connection)}
        disabled={!enableInteraction}
        accessibilityRole="button"
        accessibilityLabel={`Payment arrow from ${connection.fromPlayer.playerName} to ${connection.toPlayer.playerName}, ${formatCurrency(connection.amount)}`}
      >
        {/* Connection Line */}
        <View
          style={[
            styles.connectionLine,
            {
              left: startX,
              top: startY,
              width: arrowLength,
              height: connection.thickness,
              backgroundColor: connection.color,
              transform: [
                { rotate: `${angle}rad` },
                { translateY: -connection.thickness / 2 },
              ],
            },
          ]}
        />
        
        {/* Arrow Head */}
        <View
          style={[
            styles.arrowHead,
            {
              left: endX - 6,
              top: endY - 6,
              borderLeftColor: connection.color,
            },
          ]}
        />
        
        {/* Amount Label */}
        {showAmounts && (
          <View
            style={[
              styles.amountLabel,
              {
                left: (startX + endX) / 2 - 30,
                top: (startY + endY) / 2 - 10,
              },
            ]}
          >
            <Text style={styles.amountText}>
              {formatCurrency(connection.amount)}
            </Text>
          </View>
        )}
        
        {/* Priority Badge */}
        {showPriority && (
          <View
            style={[
              styles.priorityBadge,
              {
                left: startX + 20,
                top: startY - 10,
              },
            ]}
          >
            <Text style={styles.priorityText}>{connection.priority}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [getConnectionPath, handlePaymentPress, enableInteraction, showAmounts, showPriority, formatCurrency]);

  // Render legend
  const renderLegend = useCallback(() => {
    return (
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Creditor (receives money)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
            <Text style={styles.legendText}>Debtor (pays money)</Text>
          </View>
          {highlightOptimalPath && (
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Optimal payment</Text>
            </View>
          )}
        </View>
      </View>
    );
  }, [highlightOptimalPath]);

  if (payments.length === 0) {
    return (
      <View style={styles.container} accessibilityLabel={accessibilityLabel}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🔄</Text>
          <Text style={styles.emptyStateTitle}>No Transactions</Text>
          <Text style={styles.emptyStateText}>
            No payment flows to visualize
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      accessibilityLabel={accessibilityLabel}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {payments.length} payment{payments.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Flow Canvas */}
      <View style={[styles.canvas, { width: canvasWidth, height: canvasHeight }]}>
        {/* Render connections first (behind nodes) */}
        {flowConnections.map(renderConnection)}
        
        {/* Render player nodes */}
        {playerNodes.map(renderPlayerNode)}
      </View>

      {/* Legend */}
      {renderLegend()}

      {/* Summary Stats */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Flow Summary</Text>
        <View style={styles.summaryItems}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Players:</Text>
            <Text style={styles.summaryValue}>{playerNodes.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Payments:</Text>
            <Text style={styles.summaryValue}>{payments.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Amount:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  scrollContent: {
    padding: 16,
  },
  
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  
  canvas: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  
  playerNode: {
    position: 'absolute',
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  playerName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 12,
  },
  
  playerAmount: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
  
  connectionContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  connectionLine: {
    position: 'absolute',
    borderRadius: 2,
  },
  
  arrowHead: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  
  amountLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  amountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
  
  priorityBadge: {
    position: 'absolute',
    backgroundColor: '#FF9800',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  priorityText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  legend: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  
  legendItems: {
    gap: 6,
  },
  
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 2,
    marginRight: 8,
  },
  
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  
  summary: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
  },
  
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 8,
  },
  
  summaryItems: {
    gap: 4,
  },
  
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  summaryLabel: {
    fontSize: 12,
    color: '#1976D2',
  },
  
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1565C0',
  },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});