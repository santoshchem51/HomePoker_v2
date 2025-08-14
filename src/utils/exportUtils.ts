/**
 * Export Utilities for Settlement Proof System
 * Story 3.3, Task 6 - Mathematical Proof Export System
 * 
 * Provides file management and export utilities for proof documents
 */

import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { MathematicalProof, ExportMetadata, ExportFormat } from '../types/settlement';

export interface ExportOptions {
  format: ExportFormat;
  includeSignature?: boolean;
  includeTimestamp?: boolean;
  compressionLevel?: 'none' | 'medium' | 'high';
  watermark?: string;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileSize?: number;
  checksum?: string;
  error?: string;
  metadata: ExportMetadata;
}

export class ProofExportManager {
  private static instance: ProofExportManager;
  private exportHistory: Map<string, ExportMetadata[]> = new Map();

  private constructor() {}

  public static getInstance(): ProofExportManager {
    if (!ProofExportManager.instance) {
      ProofExportManager.instance = new ProofExportManager();
    }
    return ProofExportManager.instance;
  }

  /**
   * Export mathematical proof to specified format
   */
  public async exportProof(
    proof: MathematicalProof,
    options: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();
    
    try {
      switch (options.format) {
        case 'pdf':
          return await this.exportToPDF(proof, options);
        case 'json':
          return await this.exportToJSON(proof, options);
        case 'text':
          return await this.exportToText(proof, options);
        case 'csv':
          return await this.exportToCSV(proof, options);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const metadata: ExportMetadata = {
        exportId: this.generateExportId(),
        proofId: proof.proofId,
        format: options.format,
        exportedAt: new Date(),
        fileSize: 0,
        checksum: '',
        status: 'failed',
        error: errorMessage,
        processingTime: Date.now() - startTime
      };

      this.addToHistory(proof.proofId, metadata);
      
      return {
        success: false,
        error: errorMessage,
        metadata
      };
    }
  }

  /**
   * Export proof to PDF format with complete mathematical breakdown
   */
  private async exportToPDF(
    proof: MathematicalProof,
    options: ExportOptions
  ): Promise<ExportResult> {
    const htmlContent = this.generatePDFContent(proof, options);
    const fileName = `proof_${proof.proofId}_${Date.now()}.pdf`;

    try {
      const pdfOptions = {
        html: htmlContent,
        fileName: fileName,
        directory: this.getExportDirectory(),
        width: 612,
        height: 792,
        padding: 24,
        bgColor: '#FFFFFF'
      };

      const file = await RNHTMLtoPDF.convert(pdfOptions);
      const fileSize = await this.getFileSize(file.filePath);
      const checksum = await this.calculateFileChecksum(file.filePath);

      const metadata: ExportMetadata = {
        exportId: this.generateExportId(),
        proofId: proof.proofId,
        format: 'pdf',
        exportedAt: new Date(),
        fileName,
        filePath: file.filePath,
        fileSize,
        checksum,
        status: 'completed',
        processingTime: Date.now() - Date.now()
      };

      this.addToHistory(proof.proofId, metadata);

      return {
        success: true,
        filePath: file.filePath,
        fileSize,
        checksum,
        metadata
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown PDF generation error';
      throw new Error(`PDF generation failed: ${errorMessage}`);
    }
  }

  /**
   * Export proof to enhanced JSON format with full data structure
   */
  private async exportToJSON(
    proof: MathematicalProof,
    options: ExportOptions
  ): Promise<ExportResult> {
    const fileName = `proof_${proof.proofId}_${Date.now()}.json`;
    const filePath = `${this.getExportDirectory()}/${fileName}`;

    try {
      const enhancedData = {
        ...proof.exportFormats.json,
        exportMetadata: {
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
          format: 'json',
          includesSignature: options.includeSignature,
          checksumAlgorithm: 'SHA-256'
        },
        verificationData: {
          originalChecksum: proof.checksum,
          originalSignature: proof.signature,
          exportChecksum: await this.calculateDataChecksum(proof.exportFormats.json),
          verificationTimestamp: new Date().toISOString()
        },
        programmaticVerification: {
          canVerifyBalance: true,
          canVerifyCalculations: true,
          canReconstructSettlement: true,
          supportedValidations: [
            'balance_integrity',
            'calculation_accuracy',
            'algorithmic_consistency',
            'precision_compliance'
          ]
        }
      };

      const jsonContent = JSON.stringify(enhancedData, null, 2);
      await RNFS.writeFile(filePath, jsonContent, 'utf8');
      
      const fileSize = await this.getFileSize(filePath);
      const checksum = await this.calculateFileChecksum(filePath);

      const metadata: ExportMetadata = {
        exportId: this.generateExportId(),
        proofId: proof.proofId,
        format: 'json',
        exportedAt: new Date(),
        fileName,
        filePath,
        fileSize,
        checksum,
        status: 'completed',
        processingTime: Date.now() - Date.now()
      };

      this.addToHistory(proof.proofId, metadata);

      return {
        success: true,
        filePath,
        fileSize,
        checksum,
        metadata
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown JSON export error';
      throw new Error(`JSON export failed: ${errorMessage}`);
    }
  }

  /**
   * Export enhanced WhatsApp-friendly text summary
   */
  private async exportToText(
    proof: MathematicalProof,
    options: ExportOptions
  ): Promise<ExportResult> {
    const fileName = `proof_${proof.proofId}_${Date.now()}.txt`;
    const filePath = `${this.getExportDirectory()}/${fileName}`;

    try {
      const textContent = this.generateEnhancedTextSummary(proof, options);
      await RNFS.writeFile(filePath, textContent, 'utf8');
      
      const fileSize = await this.getFileSize(filePath);
      const checksum = await this.calculateFileChecksum(filePath);

      const metadata: ExportMetadata = {
        exportId: this.generateExportId(),
        proofId: proof.proofId,
        format: 'text',
        exportedAt: new Date(),
        fileName,
        filePath,
        fileSize,
        checksum,
        status: 'completed',
        processingTime: Date.now() - Date.now()
      };

      this.addToHistory(proof.proofId, metadata);

      return {
        success: true,
        filePath,
        fileSize,
        checksum,
        metadata
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown text export error';
      throw new Error(`Text export failed: ${errorMessage}`);
    }
  }

  /**
   * Export proof data to CSV format for spreadsheet analysis
   */
  private async exportToCSV(
    proof: MathematicalProof,
    options: ExportOptions
  ): Promise<ExportResult> {
    const fileName = `proof_${proof.proofId}_${Date.now()}.csv`;
    const filePath = `${this.getExportDirectory()}/${fileName}`;

    try {
      const csvContent = this.generateCSVContent(proof);
      await RNFS.writeFile(filePath, csvContent, 'utf8');
      
      const fileSize = await this.getFileSize(filePath);
      const checksum = await this.calculateFileChecksum(filePath);

      const metadata: ExportMetadata = {
        exportId: this.generateExportId(),
        proofId: proof.proofId,
        format: 'csv',
        exportedAt: new Date(),
        fileName,
        filePath,
        fileSize,
        checksum,
        status: 'completed',
        processingTime: Date.now() - Date.now()
      };

      this.addToHistory(proof.proofId, metadata);

      return {
        success: true,
        filePath,
        fileSize,
        checksum,
        metadata
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown CSV export error';
      throw new Error(`CSV export failed: ${errorMessage}`);
    }
  }

  /**
   * Share exported proof file using device sharing capabilities
   */
  public async shareProof(exportResult: ExportResult): Promise<boolean> {
    if (!exportResult.success || !exportResult.filePath) {
      throw new Error('Cannot share unsuccessful export');
    }

    try {
      const shareOptions = {
        title: 'Poker Settlement Proof',
        message: `Mathematical proof for settlement ${exportResult.metadata.proofId}`,
        url: `file://${exportResult.filePath}`,
        type: this.getMimeType(exportResult.metadata.format)
      };

      const result = await Share.open(shareOptions);
      return result.success || false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sharing error';
      if (errorMessage !== 'User did not share') {
        throw new Error(`Sharing failed: ${errorMessage}`);
      }
      return false;
    }
  }

  /**
   * Retrieve export history for a specific proof
   */
  public getExportHistory(proofId: string): ExportMetadata[] {
    return this.exportHistory.get(proofId) || [];
  }

  /**
   * Clear export history older than specified days
   */
  public clearOldHistory(daysBefore: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBefore);
    
    let removedCount = 0;
    
    for (const [proofId, exports] of this.exportHistory.entries()) {
      const filteredExports = exports.filter(exp => exp.exportedAt > cutoffDate);
      
      if (filteredExports.length !== exports.length) {
        removedCount += exports.length - filteredExports.length;
        
        if (filteredExports.length === 0) {
          this.exportHistory.delete(proofId);
        } else {
          this.exportHistory.set(proofId, filteredExports);
        }
      }
    }
    
    return removedCount;
  }

  /**
   * Generate comprehensive PDF content with mathematical breakdown
   */
  private generatePDFContent(proof: MathematicalProof, options: ExportOptions): string {
    const timestamp = new Date().toLocaleString();
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mathematical Proof - ${proof.proofId}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #4CAF50;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .section {
          margin-bottom: 30px;
          padding: 15px;
          border-left: 4px solid #4CAF50;
          background-color: #f9f9f9;
        }
        .calculation-step {
          background-color: #fff;
          border: 1px solid #ddd;
          padding: 15px;
          margin: 10px 0;
          border-radius: 5px;
        }
        .formula {
          font-family: 'Courier New', monospace;
          background-color: #f5f5f5;
          padding: 10px;
          border-radius: 3px;
          margin: 10px 0;
        }
        .verification-pass {
          color: #4CAF50;
          font-weight: bold;
        }
        .verification-fail {
          color: #f44336;
          font-weight: bold;
        }
        .signature-section {
          margin-top: 40px;
          padding: 20px;
          background-color: #e8f5e8;
          border-radius: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #4CAF50;
          color: white;
        }
        .watermark {
          position: fixed;
          bottom: 10px;
          right: 10px;
          opacity: 0.3;
          font-size: 10px;
          color: #888;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Mathematical Proof of Settlement</h1>
        <h2>Proof ID: ${proof.proofId}</h2>
        <p>Settlement ID: ${proof.settlementId}</p>
        <p>Generated: ${timestamp}</p>
      </div>

      <div class="section">
        <h3>Executive Summary</h3>
        <p>${proof.humanReadableSummary}</p>
      </div>

      <div class="section">
        <h3>Calculation Steps</h3>
        ${proof.calculationSteps.map((step) => `
          <div class="calculation-step">
            <h4>Step ${step.stepNumber}: ${step.operation}</h4>
            <p><strong>Description:</strong> ${step.description}</p>
            <div class="formula">
              <strong>Formula:</strong> ${step.calculation}<br>
              <strong>Result:</strong> ${step.result.toFixed(step.precision)}
            </div>
            <p><strong>Verification:</strong> 
              <span class="${step.verification ? 'verification-pass' : 'verification-fail'}">
                ${step.verification ? '✓ PASS' : '✗ FAIL'}
              </span>
            </p>
            <p><strong>Tolerance:</strong> ±${step.tolerance}</p>
          </div>
        `).join('')}
      </div>

      <div class="section">
        <h3>Player Positions</h3>
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Buy-ins</th>
              <th>Cash-outs</th>
              <th>Current Chips</th>
              <th>Net Position</th>
              <th>Settlement</th>
            </tr>
          </thead>
          <tbody>
            ${proof.exportFormats.json.playerPositions.map(player => `
              <tr>
                <td>${player.playerName}</td>
                <td>$${player.buyIns.toFixed(2)}</td>
                <td>$${player.cashOuts.toFixed(2)}</td>
                <td>$${player.currentChips.toFixed(2)}</td>
                <td>$${player.netPosition.toFixed(2)}</td>
                <td class="${player.settlementType === 'receive' ? 'verification-pass' : player.settlementType === 'pay' ? 'verification-fail' : ''}">
                  ${player.settlementType === 'receive' ? '+' : player.settlementType === 'pay' ? '-' : ''}$${Math.abs(player.settlementAmount).toFixed(2)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h3>Precision Analysis</h3>
        <p><strong>Decimal Precision:</strong> ${proof.precisionAnalysis.calculatedPrecision} digits</p>
        <p><strong>Rounding Operations:</strong> ${proof.precisionAnalysis.roundingOperations.length}</p>
        <p><strong>Precision Loss:</strong> ${proof.precisionAnalysis.precisionLoss.toFixed(6)}</p>
        <p><strong>Within Tolerance:</strong> 
          <span class="${proof.precisionAnalysis.isWithinTolerance ? 'verification-pass' : 'verification-fail'}">
            ${proof.precisionAnalysis.isWithinTolerance ? 'YES' : 'NO'}
          </span>
        </p>
      </div>

      ${options.includeSignature ? `
        <div class="signature-section">
          <h3>Verification Signature</h3>
          <p><strong>Checksum:</strong> ${proof.checksum}</p>
          <p><strong>Signature:</strong> ${proof.signature}</p>
          <p><strong>Validation:</strong> 
            <span class="${proof.isValid ? 'verification-pass' : 'verification-fail'}">
              ${proof.isValid ? 'VALID' : 'INVALID'}
            </span>
          </p>
        </div>
      ` : ''}

      ${options.watermark ? `<div class="watermark">${options.watermark}</div>` : ''}
    </body>
    </html>
    `;
  }

  /**
   * Generate enhanced WhatsApp-friendly text summary
   */
  private generateEnhancedTextSummary(proof: MathematicalProof, _options: ExportOptions): string {
    const passedSteps = proof.calculationSteps.filter(step => step.verification).length;
    const totalSteps = proof.calculationSteps.length;
    const timestamp = new Date().toLocaleString();
    
    let summary = `🏆 POKER SETTLEMENT MATHEMATICAL PROOF\n`;
    summary += `${'='.repeat(45)}\n\n`;
    
    summary += `📋 SETTLEMENT DETAILS\n`;
    summary += `Settlement ID: ${proof.settlementId.substring(0, 12)}...\n`;
    summary += `Proof ID: ${proof.proofId}\n`;
    summary += `Generated: ${timestamp}\n\n`;
    
    summary += `💰 FINANCIAL SUMMARY\n`;
    const balanceData = proof.exportFormats.json.balanceVerification;
    summary += `Total Amount: $${balanceData.totalDebits.toFixed(2)}\n`;
    summary += `Balance Status: ${balanceData.isBalanced ? '✅ BALANCED' : '❌ UNBALANCED'}\n`;
    summary += `Precision: ${balanceData.precision} decimal places\n`;
    summary += `Tolerance: ±$${balanceData.tolerance.toFixed(4)}\n\n`;
    
    summary += `🔍 VERIFICATION RESULTS\n`;
    summary += `Mathematical Checks: ${passedSteps}/${totalSteps} passed\n`;
    summary += `Overall Status: ${proof.isValid ? '✅ VALID' : '❌ INVALID'}\n`;
    summary += `Algorithm Consensus: ${proof.exportFormats.json.algorithmComparison.consensusResult ? '✅ CONSENSUS' : '❌ DISCREPANCY'}\n\n`;
    
    summary += `👥 PLAYER POSITIONS\n`;
    for (const player of proof.exportFormats.json.playerPositions) {
      const icon = player.settlementType === 'receive' ? '💰' : player.settlementType === 'pay' ? '💸' : '⚖️';
      summary += `${icon} ${player.playerName}: `;
      
      if (player.settlementType === 'receive') {
        summary += `receives $${player.settlementAmount.toFixed(2)}\n`;
      } else if (player.settlementType === 'pay') {
        summary += `pays $${Math.abs(player.settlementAmount).toFixed(2)}\n`;
      } else {
        summary += `even (no payment)\n`;
      }
    }
    
    summary += `\n📊 OPTIMIZATION METRICS\n`;
    const optimization = proof.exportFormats.json.algorithmComparison.primaryAlgorithm;
    summary += `Transactions: ${optimization.transactionCount}\n`;
    summary += `Algorithm: ${optimization.algorithmName}\n`;
    summary += `Balance Check: ${optimization.isBalanced ? '✅ PASS' : '❌ FAIL'}\n\n`;
    
    if (_options.includeSignature && _options.includeTimestamp) {
      summary += `🔐 VERIFICATION SIGNATURE\n`;
      summary += `Checksum: ${proof.checksum.substring(0, 16)}...\n`;
      summary += `Signature: ${proof.signature.substring(0, 16)}...\n\n`;
    }
    
    summary += `📱 This proof was generated using HomePoker v2\n`;
    summary += `Mathematical verification system\n`;
    summary += `For full details, request the PDF or JSON export.\n`;
    
    return summary;
  }

  /**
   * Generate CSV content for spreadsheet analysis
   */
  private generateCSVContent(proof: MathematicalProof): string {
    let csv = '';
    
    // Header section
    csv += `Proof Export,${proof.proofId}\n`;
    csv += `Settlement ID,${proof.settlementId}\n`;
    csv += `Generated At,${proof.generatedAt.toISOString()}\n`;
    csv += `Valid,${proof.isValid}\n\n`;
    
    // Player positions
    csv += `Player Positions\n`;
    csv += `Player Name,Buy-ins,Cash-outs,Current Chips,Net Position,Settlement Amount,Settlement Type,Verified\n`;
    
    for (const player of proof.exportFormats.json.playerPositions) {
      csv += `${player.playerName},${player.buyIns},${player.cashOuts},${player.currentChips},${player.netPosition},${player.settlementAmount},${player.settlementType},${player.verification}\n`;
    }
    
    csv += `\nSettlement Payments\n`;
    csv += `Payment ID,From Player,To Player,Amount,Verified\n`;
    
    for (const settlement of proof.exportFormats.json.settlements) {
      csv += `${settlement.paymentId},${settlement.fromPlayer},${settlement.toPlayer},${settlement.amount},${settlement.verification}\n`;
    }
    
    csv += `\nCalculation Steps\n`;
    csv += `Step,Operation,Description,Result,Precision,Verified,Tolerance\n`;
    
    for (const step of proof.calculationSteps) {
      csv += `${step.stepNumber},"${step.operation}","${step.description}",${step.result},${step.precision},${step.verification},${step.tolerance}\n`;
    }
    
    return csv;
  }

  /**
   * Utility methods for file operations
   */
  private getExportDirectory(): string {
    return Platform.OS === 'ios' 
      ? RNFS.DocumentDirectoryPath + '/ProofExports'
      : RNFS.ExternalDirectoryPath + '/ProofExports';
  }

  private async _ensureExportDirectory(): Promise<void> {
    const dir = this.getExportDirectory();
    const exists = await RNFS.exists(dir);
    
    if (!exists) {
      await RNFS.mkdir(dir);
    }
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stat = await RNFS.stat(filePath);
      return stat.size;
    } catch {
      return 0;
    }
  }

  private async calculateFileChecksum(filePath: string): Promise<string> {
    try {
      return await RNFS.hash(filePath, 'sha256');
    } catch {
      return '';
    }
  }

  private async calculateDataChecksum(data: any): Promise<string> {
    const content = JSON.stringify(data);
    // Simple hash implementation for React Native
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private generateExportId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getMimeType(format: ExportFormat): string {
    switch (format) {
      case 'pdf': return 'application/pdf';
      case 'json': return 'application/json';
      case 'text': return 'text/plain';
      case 'csv': return 'text/csv';
      default: return 'application/octet-stream';
    }
  }

  private addToHistory(proofId: string, metadata: ExportMetadata): void {
    if (!this.exportHistory.has(proofId)) {
      this.exportHistory.set(proofId, []);
    }
    
    const history = this.exportHistory.get(proofId)!;
    history.push(metadata);
    
    // Keep only last 10 exports per proof
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
  }
}

// Singleton instance
export const proofExportManager = ProofExportManager.getInstance();

/**
 * Convenience functions for quick exports
 */
export async function exportProofToPDF(
  proof: MathematicalProof,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  return proofExportManager.exportProof(proof, {
    format: 'pdf',
    includeSignature: true,
    includeTimestamp: true,
    ...options
  });
}

export async function exportProofToWhatsApp(
  proof: MathematicalProof,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  return proofExportManager.exportProof(proof, {
    format: 'text',
    includeSignature: false,
    includeTimestamp: true,
    ...options
  });
}

export async function exportProofForVerification(
  proof: MathematicalProof,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  return proofExportManager.exportProof(proof, {
    format: 'json',
    includeSignature: true,
    includeTimestamp: true,
    ...options
  });
}