/**
 * Per-chat message queue for sequential processing
 * Prevents concurrent handling of messages from the same chat
 */

import { logger } from '@flowhq/shared';

interface QueuedMessage {
  id: string;
  chatId: string;
  execute: () => Promise<void>;
  resolve: () => void;
  reject: (error: Error) => void;
}

interface ChatQueue {
  messages: QueuedMessage[];
  processing: boolean;
}

export class ChatQueueManager {
  private queues: Map<string, ChatQueue> = new Map();
  private maxQueueSize: number;
  private tenantId: string;

  constructor(tenantId: string, maxQueueSize: number = 50) {
    this.tenantId = tenantId;
    this.maxQueueSize = maxQueueSize;
  }

  /**
   * Enqueue a message for processing
   * Returns promise that resolves when message is processed
   */
  async enqueue<T>(chatId: string, execute: () => Promise<T>): Promise<T> {
    const queue = this.getOrCreateQueue(chatId);

    // Check queue size limit
    if (queue.messages.length >= this.maxQueueSize) {
      logger.warn({ tenantId: this.tenantId, chatId }, 'Chat queue full, rejecting message');
      throw new Error('QUEUE_FULL: Too many pending messages for this chat');
    }

    return new Promise((resolve, reject) => {
      const message: QueuedMessage = {
        id: `${chatId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        chatId,
        execute: async () => {
          try {
            const result = await execute();
            resolve(result as T);
          } catch (error) {
            reject(error as Error);
          }
        },
        resolve: () => resolve(undefined as T),
        reject
      };

      queue.messages.push(message);
      logger.debug({ tenantId: this.tenantId, chatId, queueSize: queue.messages.length }, 'Message enqueued');

      // Start processing if not already running
      if (!queue.processing) {
        this.processQueue(chatId);
      }
    });
  }

  /**
   * Get queue size for a chat
   */
  getQueueSize(chatId: string): number {
    const queue = this.queues.get(chatId);
    return queue ? queue.messages.length : 0;
  }

  /**
   * Get total queued messages across all chats
   */
  getTotalQueued(): number {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += queue.messages.length;
    }
    return total;
  }

  /**
   * Clear all queues (for shutdown)
   */
  clearAll(): void {
    for (const [chatId, queue] of this.queues) {
      // Reject all pending messages
      for (const msg of queue.messages) {
        msg.reject(new Error('Queue cleared during shutdown'));
      }
      queue.messages = [];
      queue.processing = false;
    }
    this.queues.clear();
  }

  private getOrCreateQueue(chatId: string): ChatQueue {
    let queue = this.queues.get(chatId);
    if (!queue) {
      queue = { messages: [], processing: false };
      this.queues.set(chatId, queue);
    }
    return queue;
  }

  private async processQueue(chatId: string): Promise<void> {
    const queue = this.queues.get(chatId);
    if (!queue || queue.processing) return;

    queue.processing = true;

    while (queue.messages.length > 0) {
      const message = queue.messages.shift();
      if (!message) continue;

      try {
        logger.debug({ tenantId: this.tenantId, chatId, messageId: message.id }, 'Processing queued message');
        await message.execute();
      } catch (error) {
        logger.error({ tenantId: this.tenantId, chatId, messageId: message.id, error }, 'Error processing queued message');
        // Continue with next message even if this one failed
      }
    }

    queue.processing = false;

    // Clean up empty queues to prevent memory leak
    if (queue.messages.length === 0) {
      this.queues.delete(chatId);
    }
  }
}
