import { Client } from 'whatsapp-web.js';
import { MessagingAdapter, OutboundResult } from './interface';

export class WwebjsAdapter implements MessagingAdapter {
  constructor(private client: Client) {}

  async sendMessage(to: string, text: string): Promise<OutboundResult> {
    const sent = await this.client.sendMessage(to, text);
    return { messageId: sent.id.id };
  }

  async sendTypingIndicator(to: string): Promise<void> {
    try {
      const chat = await this.client.getChatById(to);
      await chat.sendStateTyping();
    } catch {
      // Non-critical — ignore if typing indicator fails
    }
  }
}
