import RNFS from 'react-native-fs';
import { DatabaseService } from './DatabaseService';
import { ServiceError, ErrorCode } from '../../types/errors';
// Simple hash implementation for React Native compatibility
import CryptoJS from 'crypto-js';

export type ExportFormat = 'json' | 'csv' | 'whatsapp';

interface ExportResult {
  filePath: string;
  format: ExportFormat;
  fileSize: number;
  checksum: string;
}

export class ExportService {
  private static instance: ExportService | null = null;
  private db: DatabaseService;
  private exportDirectory: string;

  private constructor() {
    this.db = DatabaseService.getInstance();
    this.exportDirectory = `${RNFS.DocumentDirectoryPath}/exports`;
  }

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  async initialize(): Promise<void> {
    try {
      const exists = await RNFS.exists(this.exportDirectory);
      if (!exists) {
        await RNFS.mkdir(this.exportDirectory);
      }
    } catch (error) {
      throw new ServiceError(
        ErrorCode.EXPORT_INIT_FAILED,
        'Failed to initialize export service',
        error as Record<string, any>
      );
    }
  }

  async exportSession(sessionId: string, format: ExportFormat): Promise<ExportResult> {
    try {
      const sessionData = await this.getSessionData(sessionId);
      
      let content: string;
      let fileName: string;
      
      switch (format) {
        case 'json':
          content = this.formatAsJSON(sessionData);
          fileName = `session_${sessionId}_${Date.now()}.json`;
          break;
        case 'csv':
          content = this.formatAsCSV(sessionData);
          fileName = `session_${sessionId}_${Date.now()}.csv`;
          break;
        case 'whatsapp':
          content = this.formatForWhatsApp(sessionData);
          fileName = `session_${sessionId}_${Date.now()}.txt`;
          break;
        default:
          throw new ServiceError(ErrorCode.INVALID_FORMAT, `Unsupported export format: ${format}`);
      }
      
      const filePath = `${this.exportDirectory}/${fileName}`;
      await RNFS.writeFile(filePath, content, 'utf8');
      
      const stats = await RNFS.stat(filePath);
      const checksum = await this.calculateChecksum(content);
      
      // Record the export in database
      await this.recordExport(sessionId, format, filePath, stats.size, checksum);
      
      // Mark session as exported
      const SessionService = require('../core/SessionService').SessionService;
      const sessionService = SessionService.getInstance();
      await sessionService.markSessionExported(sessionId, format, filePath);
      
      return {
        filePath,
        format,
        fileSize: stats.size,
        checksum
      };
    } catch (error) {
      throw new ServiceError(
        ErrorCode.EXPORT_FAILED,
        `Failed to export session: ${error}`,
        error as Record<string, any>
      );
    }
  }

  private async getSessionData(sessionId: string): Promise<any> {
    const sessionResult = await this.db.executeQuery(
      'SELECT * FROM sessions WHERE id = ?',
      [sessionId]
    );
    
    if (!sessionResult || sessionResult.rows.length === 0) {
      throw new ServiceError(ErrorCode.SESSION_NOT_FOUND, 'Session not found for export');
    }
    
    const playersResult = await this.db.executeQuery(
      'SELECT * FROM players WHERE session_id = ?',
      [sessionId]
    );
    
    const transactionsResult = await this.db.executeQuery(
      'SELECT * FROM transactions WHERE session_id = ? AND is_voided = 0 ORDER BY timestamp',
      [sessionId]
    );
    
    return {
      session: sessionResult.rows.item(0),
      players: playersResult.rows.raw(),
      transactions: transactionsResult.rows.raw()
    };
  }

  private formatAsJSON(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  private formatAsCSV(data: any): string {
    const lines: string[] = [];
    
    // Session header
    lines.push('Session Information');
    lines.push(`Name,${data.session.name}`);
    lines.push(`Status,${data.session.status}`);
    lines.push(`Total Pot,$${data.session.total_pot}`);
    lines.push(`Started,${data.session.started_at || 'N/A'}`);
    lines.push(`Completed,${data.session.completed_at || 'N/A'}`);
    lines.push('');
    
    // Players section
    lines.push('Players');
    lines.push('Name,Buy-ins,Cash-outs,Balance');
    
    for (const player of data.players) {
      lines.push(
        `${player.name},$${player.total_buy_ins},$${player.total_cash_outs},$${player.current_balance}`
      );
    }
    lines.push('');
    
    // Transactions section
    lines.push('Transactions');
    lines.push('Time,Player,Type,Amount');
    
    for (const tx of data.transactions) {
      const player = data.players.find((p: any) => p.id === tx.player_id);
      lines.push(
        `${tx.timestamp},${player?.name || 'Unknown'},${tx.type},$${tx.amount}`
      );
    }
    
    return lines.join('\n');
  }

  private formatForWhatsApp(data: any): string {
    const lines: string[] = [];
    
    lines.push(`🎰 *PokePot Session Summary*`);
    lines.push(`📅 ${data.session.name}`);
    lines.push('');
    lines.push('*Final Results:*');
    
    // Sort players by balance for leaderboard
    const sortedPlayers = [...data.players].sort(
      (a, b) => b.current_balance - a.current_balance
    );
    
    for (const player of sortedPlayers) {
      const emoji = player.current_balance > 0 ? '💰' : player.current_balance < 0 ? '💸' : '➖';
      const amount = Math.abs(player.current_balance);
      lines.push(`${emoji} ${player.name}: $${amount.toFixed(2)}`);
    }
    
    lines.push('');
    lines.push(`💵 *Total Pot:* $${data.session.total_pot}`);
    
    // Calculate settlements
    const settlements = this.calculateSettlements(data.players);
    if (settlements.length > 0) {
      lines.push('');
      lines.push('*Settlements:*');
      for (const settlement of settlements) {
        lines.push(`➡️ ${settlement}`);
      }
    }
    
    lines.push('');
    lines.push('_Generated by PokePot_');
    
    return lines.join('\n');
  }

  private calculateSettlements(players: any[]): string[] {
    const settlements: string[] = [];
    const debts = players.filter(p => p.current_balance < 0)
      .map(p => ({ name: p.name, amount: Math.abs(p.current_balance) }))
      .sort((a, b) => b.amount - a.amount);
    
    const credits = players.filter(p => p.current_balance > 0)
      .map(p => ({ name: p.name, amount: p.current_balance }))
      .sort((a, b) => b.amount - a.amount);
    
    for (const debtor of debts) {
      let remaining = debtor.amount;
      
      for (const creditor of credits) {
        if (remaining <= 0 || creditor.amount <= 0) continue;
        
        const payment = Math.min(remaining, creditor.amount);
        settlements.push(`${debtor.name} pays ${creditor.name} $${payment.toFixed(2)}`);
        
        remaining -= payment;
        creditor.amount -= payment;
      }
    }
    
    return settlements;
  }

  private async calculateChecksum(content: string): Promise<string> {
    return CryptoJS.SHA256(content).toString();
  }

  private async recordExport(
    sessionId: string,
    format: ExportFormat,
    filePath: string,
    fileSize: number,
    checksum: string
  ): Promise<void> {
    const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const query = `
      INSERT INTO session_exports (
        id, session_id, export_format, file_path, 
        file_size, checksum
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await this.db.executeQuery(query, [
      exportId,
      sessionId,
      format,
      filePath,
      fileSize,
      checksum
    ]);
  }

  async getExportHistory(sessionId: string): Promise<any[]> {
    const query = `
      SELECT * FROM session_exports
      WHERE session_id = ?
      ORDER BY exported_at DESC
    `;
    
    const result = await this.db.executeQuery(query, [sessionId]);
    return result.rows.raw();
  }

  async deleteOldExports(daysToKeep: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const exportsResult = await this.db.executeQuery(
      'SELECT * FROM session_exports WHERE exported_at < ?',
      [cutoffDate.toISOString()]
    );
    const exports = exportsResult.rows.raw();
    
    for (const exp of exports) {
      try {
        const exists = await RNFS.exists(exp.file_path);
        if (exists) {
          await RNFS.unlink(exp.file_path);
        }
      } catch (error) {
        console.error(`Failed to delete export file: ${exp.file_path}`, error);
      }
    }
    
    await this.db.executeQuery(
      'DELETE FROM session_exports WHERE exported_at < ?',
      [cutoffDate.toISOString()]
    );
  }
}