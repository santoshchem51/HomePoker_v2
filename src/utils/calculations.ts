/**
 * CalculationUtils - Financial precision utilities for currency calculations
 * Required by coding standards to prevent floating-point precision errors
 */

export class CalculationUtils {
  /**
   * Add two amounts with precision handling for currency
   * Prevents floating-point precision errors in settlements
   */
  public static addAmounts(amount1: number, amount2: number): number {
    // Convert to cents to avoid floating point issues
    const cents1 = Math.round(amount1 * 100);
    const cents2 = Math.round(amount2 * 100);
    return (cents1 + cents2) / 100;
  }

  /**
   * Subtract amount2 from amount1 with precision handling for currency
   * Prevents floating-point precision errors in settlements
   */
  public static subtractAmounts(amount1: number, amount2: number): number {
    // Convert to cents to avoid floating point issues
    const cents1 = Math.round(amount1 * 100);
    const cents2 = Math.round(amount2 * 100);
    return (cents1 - cents2) / 100;
  }

  /**
   * Round amount to 2 decimal places for currency display
   */
  public static roundToCurrency(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Validate amount has maximum 2 decimal places
   */
  public static isValidCurrencyAmount(amount: number): boolean {
    return Number.isInteger(amount * 100);
  }

  /**
   * Format currency amount for display
   * Story 4.2: AC 4, 5 - Enhanced formatting for mobile readability
   */
  public static formatCurrency(amount: number): string {
    return Math.abs(amount).toFixed(2);
  }
}