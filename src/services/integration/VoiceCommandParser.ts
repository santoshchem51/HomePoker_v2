/**
 * VoiceCommandParser - Integration service for parsing voice commands into structured data
 * Implements Story 2.2 requirements for voice-enabled buy-in commands
 */

import { ServiceError } from '../core/ServiceError';
import { 
  PlayerMatchResult, 
  AmountParseResult, 
  CommandResult, 
  SessionContext,
  VOICE_ERROR_CODES 
} from '../../types/voice';

export class VoiceCommandParser {
  private static instance: VoiceCommandParser | null = null;

  // Number word mappings for spoken number recognition
  private readonly numberWords = new Map<string, number>([
    // Basic numbers
    ['zero', 0], ['one', 1], ['two', 2], ['three', 3], ['four', 4],
    ['five', 5], ['six', 6], ['seven', 7], ['eight', 8], ['nine', 9],
    ['ten', 10], ['eleven', 11], ['twelve', 12], ['thirteen', 13], ['fourteen', 14],
    ['fifteen', 15], ['sixteen', 16], ['seventeen', 17], ['eighteen', 18], ['nineteen', 19],
    ['twenty', 20], ['thirty', 30], ['forty', 40], ['fifty', 50],
    ['sixty', 60], ['seventy', 70], ['eighty', 80], ['ninety', 90],
    // Common poker amounts
    ['hundred', 100], ['thousand', 1000],
    // Poker slang
    ['buck', 1], ['bucks', 1], ['dollar', 1], ['dollars', 1]
  ]);

  private constructor() {
    // Service initialization if needed
  }

  public static getInstance(): VoiceCommandParser {
    if (!VoiceCommandParser.instance) {
      VoiceCommandParser.instance = new VoiceCommandParser();
    }
    return VoiceCommandParser.instance;
  }

  /**
   * Parse a complete voice command into structured data
   * AC: Primary command parsing functionality
   */
  public async parseCommand(voiceInput: string, context: SessionContext): Promise<CommandResult> {
    try {
      const normalizedInput = this.normalizeInput(voiceInput);
      
      // Check if it's a buy-in command
      const isBuyInCommand = this.isBuyInCommand(normalizedInput);
      
      if (!isBuyInCommand) {
        return {
          command: 'unknown',
          playerMatch: { playerId: null, playerName: null, confidence: 0, similarMatches: [] },
          amountParse: { amount: null, confidence: 0, rawText: voiceInput, interpretedAs: 'unknown command' },
          overallConfidence: 0,
          requiresConfirmation: true
        };
      }

      // Parse player name and amount
      const playerMatch = await this.parsePlayerName(normalizedInput, context.players);
      const amountParse = await this.parseAmount(normalizedInput);

      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(playerMatch.confidence, amountParse.confidence);
      
      // Determine if confirmation is required (below 0.7 threshold)
      const requiresConfirmation = overallConfidence < 0.7;

      return {
        command: 'buy-in',
        playerMatch,
        amountParse,
        overallConfidence,
        requiresConfirmation
      };

    } catch (error) {
      throw new ServiceError(
        VOICE_ERROR_CODES.VOICE_COMMAND_AMBIGUOUS,
        'Failed to parse voice command',
        error
      );
    }
  }

  /**
   * Parse player name from voice input with fuzzy matching
   * AC: 1 - Voice parser recognizes player names from current session roster
   */
  public async parsePlayerName(voiceInput: string, sessionPlayers: Array<{id: string, name: string}>): Promise<PlayerMatchResult> {
    try {
      const normalizedInput = this.normalizeInput(voiceInput);
      const extractedName = this.extractPlayerNameFromCommand(normalizedInput);
      
      if (!extractedName) {
        return {
          playerId: null,
          playerName: null,
          confidence: 0,
          similarMatches: []
        };
      }

      // Find best match using fuzzy matching
      const matches = sessionPlayers.map(player => ({
        playerId: player.id,
        playerName: player.name,
        similarity: this.calculateSimilarity(extractedName, player.name)
      })).sort((a, b) => b.similarity - a.similarity);

      const bestMatch = matches[0];
      const similarMatches = matches.filter(m => m.similarity > 0.5).slice(0, 3);

      // Confidence based on similarity score
      const confidence = bestMatch ? bestMatch.similarity : 0;

      return {
        playerId: confidence > 0.6 ? bestMatch.playerId : null,
        playerName: confidence > 0.6 ? bestMatch.playerName : null,
        confidence,
        similarMatches
      };

    } catch (error) {
      throw new ServiceError(
        VOICE_ERROR_CODES.PLAYER_NOT_FOUND,
        'Failed to parse player name from voice input',
        error
      );
    }
  }

  /**
   * Parse amount from voice input supporting multiple formats
   * AC: 2 - Number recognition handles common formats ("fifty", "50", "five zero")
   */
  public async parseAmount(voiceInput: string): Promise<AmountParseResult> {
    try {
      const normalizedInput = this.normalizeInput(voiceInput);
      const extractedAmount = this.extractAmountFromCommand(normalizedInput);
      
      if (!extractedAmount) {
        return {
          amount: null,
          confidence: 0,
          rawText: voiceInput,
          interpretedAs: 'no amount found'
        };
      }

      // Try different parsing strategies
      let amount: number | null = null;
      let interpretedAs = '';
      let confidence = 0;

      // Strategy 1: Direct number parsing
      const directNumber = this.parseDirectNumber(extractedAmount);
      if (directNumber !== null) {
        amount = directNumber;
        interpretedAs = `direct number: ${directNumber}`;
        confidence = 0.9;
      }

      // Strategy 2: Combination parsing (e.g., "five zero" = 50) - check before word parsing
      if (amount === null) {
        const combinationNumber = this.parseCombinationNumber(extractedAmount);
        if (combinationNumber !== null) {
          amount = combinationNumber;
          interpretedAs = `combination: ${combinationNumber}`;
          confidence = 0.8; // Higher confidence than word parsing
        }
      }

      // Strategy 3: Word-based number parsing
      if (amount === null) {
        const wordNumber = this.parseWordNumber(extractedAmount);
        if (wordNumber !== null) {
          amount = wordNumber;
          interpretedAs = `word number: ${wordNumber}`;
          confidence = 0.7;
        }
      }

      // Validate amount is within poker buy-in range
      if (amount !== null && (amount < 5 || amount > 500)) {
        confidence *= 0.5; // Reduce confidence for unusual amounts
      }

      return {
        amount,
        confidence,
        rawText: extractedAmount,
        interpretedAs
      };

    } catch (error) {
      throw new ServiceError(
        VOICE_ERROR_CODES.AMOUNT_PARSE_FAILED,
        'Failed to parse amount from voice input',
        error
      );
    }
  }

  /**
   * Normalize voice input for consistent processing
   */
  private normalizeInput(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Check if input is a buy-in command
   */
  private isBuyInCommand(input: string): boolean {
    const buyInKeywords = ['add', 'buyin', 'buy in', 'give', 'put'];
    return buyInKeywords.some(keyword => input.includes(keyword));
  }

  /**
   * Extract player name from command text
   */
  private extractPlayerNameFromCommand(input: string): string | null {
    // Pattern: "add [player name] [amount]" or "give [player name] [amount]"
    // Handle various command formats including buy in (two words)
    const patterns = [
      // Pattern for "add john fifty dollars" - capture just the name before amount words
      /(?:add|give|buyin|buy\s+in)\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)/,
      // Fallback pattern for simpler commands
      /(?:add|give|buyin|buy\s+in)\s+([a-z]+)/
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        let playerName = match[1].trim();
        
        // Clean up the extracted name by removing any number words that got captured
        const numberWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
                            'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
                            'hundred', 'thousand', 'dollars', 'bucks', 'dollar', 'buck'];
        
        // Split the name and filter out number words
        const nameWords = playerName.split(' ').filter(word => !numberWords.includes(word.toLowerCase()));
        
        if (nameWords.length > 0) {
          return nameWords.join(' ');
        }
      }
    }

    return null;
  }

  /**
   * Extract amount text from command
   */
  private extractAmountFromCommand(input: string): string | null {
    // Strategy: Find the last part that contains numbers or number words
    const words = input.split(' ');
    
    // Look for number patterns from the end of the command
    for (let i = words.length - 1; i >= 0; i--) {
      const word = words[i];
      
      // Skip dollar/currency words
      if (['dollars', 'dollar', 'bucks', 'buck'].includes(word)) {
        continue;
      }
      
      // Check if this word or combination is a number
      if (/^\d+$/.test(word)) {
        return word; // Direct number
      }
      
      // Check for number words
      const numberWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
                          'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
                          'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
                          'hundred', 'thousand'];
      
      if (numberWords.includes(word)) {
        // Found a number word, now find the start of the number sequence
        let startIndex = i;
        
        // Go backwards to find the actual start of the number sequence
        while (startIndex > 0 && numberWords.includes(words[startIndex - 1])) {
          startIndex--;
        }
        
        // Collect consecutive number words from the start
        let amountWords = [];
        for (let j = startIndex; j < words.length; j++) {
          if (numberWords.includes(words[j])) {
            amountWords.push(words[j]);
          } else if (['dollars', 'dollar', 'bucks', 'buck'].includes(words[j])) {
            break; // Stop at currency words
          } else {
            break; // Stop at non-number words
          }
        }
        
        if (amountWords.length > 0) {
          return amountWords.join(' ');
        }
      }
    }
    
    return null;
  }

  /**
   * Parse direct number (e.g., "50", "100")
   */
  private parseDirectNumber(input: string): number | null {
    const number = parseInt(input, 10);
    return isNaN(number) ? null : number;
  }

  /**
   * Parse word-based numbers (e.g., "fifty", "one hundred")
   */
  private parseWordNumber(input: string): number | null {
    const words = input.split(' ');
    let total = 0;
    let current = 0;

    for (const word of words) {
      const value = this.numberWords.get(word);
      if (value !== undefined) {
        if (value === 100 || value === 1000) {
          total += current * value;
          current = 0;
        } else {
          current += value;
        }
      }
    }

    total += current;
    return total > 0 ? total : null;
  }

  /**
   * Parse combination numbers (e.g., "five zero" = 50, "one zero zero" = 100)
   */
  private parseCombinationNumber(input: string): number | null {
    const words = input.split(' ');
    
    // Handle two-digit combinations (e.g., "five zero" = 50)
    if (words.length === 2) {
      const first = this.numberWords.get(words[0]);
      const second = this.numberWords.get(words[1]);
      
      if (first !== undefined && second !== undefined && first <= 9 && second <= 9) {
        return first * 10 + second;
      }
    }
    
    // Handle three-digit combinations (e.g., "one zero zero" = 100)
    if (words.length === 3) {
      const first = this.numberWords.get(words[0]);
      const second = this.numberWords.get(words[1]);
      const third = this.numberWords.get(words[2]);
      
      if (first !== undefined && second !== undefined && third !== undefined && 
          first <= 9 && second <= 9 && third <= 9) {
        return first * 100 + second * 10 + third;
      }
    }
    
    return null;
  }

  /**
   * Calculate string similarity using enhanced algorithm for name matching
   * Handles partial matches and common name variations
   */
  private calculateSimilarity(extractedName: string, fullName: string): number {
    const extracted = extractedName.toLowerCase().trim();
    const full = fullName.toLowerCase().trim();
    
    // Exact match
    if (extracted === full) return 1.0;
    
    // Check if extracted name is a substring of full name (e.g., "john" in "John Smith")
    if (full.includes(extracted)) {
      return 0.9; // High confidence for substring matches
    }
    
    // Check if extracted name matches first name
    const nameParts = full.split(' ');
    const firstName = nameParts[0];
    if (extracted === firstName) {
      return 0.95; // Very high confidence for first name matches
    }
    
    // Check if extracted name is similar to first name
    const firstNameSimilarity = this.levenshteinSimilarity(extracted, firstName);
    if (firstNameSimilarity > 0.7) {
      return firstNameSimilarity * 0.9; // Scale down slightly but still high
    }
    
    // Check similarity to any name part
    let bestPartSimilarity = 0;
    for (const part of nameParts) {
      const partSimilarity = this.levenshteinSimilarity(extracted, part);
      bestPartSimilarity = Math.max(bestPartSimilarity, partSimilarity);
    }
    
    if (bestPartSimilarity > 0.7) {
      return bestPartSimilarity * 0.8; // Good confidence for name part matches
    }
    
    // Fallback to full name similarity
    return this.levenshteinSimilarity(extracted, full);
  }

  /**
   * Calculate Levenshtein similarity between two strings
   */
  private levenshteinSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1.0;
    
    const len1 = s1.length;
    const len2 = s2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1.0;
    
    const distance = this.levenshteinDistance(s1, s2);
    return 1 - (distance / maxLen);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate overall confidence from player and amount confidence scores
   */
  private calculateOverallConfidence(playerConfidence: number, amountConfidence: number): number {
    // Weighted average: player matching is more critical
    return (playerConfidence * 0.6) + (amountConfidence * 0.4);
  }
}

export default VoiceCommandParser.getInstance();