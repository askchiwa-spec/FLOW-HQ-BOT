/**
 * Exponential backoff reconnect manager for WhatsApp
 */

import { logger } from '@flowhq/shared';

interface ReconnectConfig {
  initialDelayMs: number;
  maxDelayMs: number;
  maxAttempts: number;
  backoffMultiplier: number;
}

export class ReconnectManager {
  private config: ReconnectConfig;
  private attemptCount: number = 0;
  private currentDelay: number;
  private isReconnecting: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private onReconnect: () => Promise<void>;
  private onMaxAttemptsReached: () => void;

  constructor(
    onReconnect: () => Promise<void>,
    onMaxAttemptsReached: () => void,
    config?: Partial<ReconnectConfig>
  ) {
    this.onReconnect = onReconnect;
    this.onMaxAttemptsReached = onMaxAttemptsReached;
    
    this.config = {
      initialDelayMs: config?.initialDelayMs || 5000,    // 5s
      maxDelayMs: config?.maxDelayMs || 300000,          // 5m
      maxAttempts: config?.maxAttempts || 10,
      backoffMultiplier: config?.backoffMultiplier || 3
    };
    
    this.currentDelay = this.config.initialDelayMs;
  }

  /**
   * Start the reconnect process
   */
  start(): void {
    if (this.isReconnecting) {
      logger.warn('Reconnect already in progress');
      return;
    }

    this.isReconnecting = true;
    this.scheduleReconnect();
  }

  /**
   * Stop the reconnect process
   */
  stop(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.isReconnecting = false;
    this.attemptCount = 0;
    this.currentDelay = this.config.initialDelayMs;
  }

  /**
   * Reset the reconnect state (call on successful connection)
   */
  reset(): void {
    this.stop();
    this.attemptCount = 0;
    this.currentDelay = this.config.initialDelayMs;
  }

  /**
   * Get current reconnect status
   */
  getStatus(): { isReconnecting: boolean; attemptCount: number; nextDelay: number } {
    return {
      isReconnecting: this.isReconnecting,
      attemptCount: this.attemptCount,
      nextDelay: this.currentDelay
    };
  }

  private scheduleReconnect(): void {
    if (this.attemptCount >= this.config.maxAttempts) {
      logger.error(`Max reconnect attempts (${this.config.maxAttempts}) reached`);
      this.isReconnecting = false;
      this.onMaxAttemptsReached();
      return;
    }

    this.attemptCount++;
    logger.info(`Scheduling reconnect attempt ${this.attemptCount}/${this.config.maxAttempts} in ${this.currentDelay}ms`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.onReconnect();
        // If reconnect succeeds, reset will be called externally
      } catch (error) {
        logger.error({ error, attempt: this.attemptCount }, 'Reconnect attempt failed');
        
        // Calculate next delay with exponential backoff
        this.currentDelay = Math.min(
          this.currentDelay * this.config.backoffMultiplier,
          this.config.maxDelayMs
        );
        
        // Schedule next attempt
        this.scheduleReconnect();
      }
    }, this.currentDelay);
  }
}
