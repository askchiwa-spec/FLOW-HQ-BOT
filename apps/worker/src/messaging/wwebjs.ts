import { Client } from 'whatsapp-web.js';
import { MessagingAdapter, OutboundResult } from './interface';

export class WwebjsAdapter implements MessagingAdapter {
  constructor(private client: Client) {}

  /** Resolve @lid contact IDs to @c.us phone numbers before sending.
   *  WhatsApp newer clients use @lid internally but sendMessage is more
   *  reliable with the @c.us phone number format. */
  private async resolveRecipient(to: string): Promise<string> {
    if (!to.endsWith('@lid')) return to;
    try {
      const results = await (this.client as any).getContactLidAndPhone([to]);
      const pn = results?.[0]?.pn;
      return pn ?? to;
    } catch {
      return to; // fall back to original if resolution fails
    }
  }

  async sendMessage(to: string, text: string): Promise<OutboundResult> {
    const TIMEOUT_MS = 25000;
    const recipient = await this.resolveRecipient(to);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`sendMessage timed out after ${TIMEOUT_MS}ms for ${to}`)), TIMEOUT_MS)
    );
    const sent = await Promise.race([this.client.sendMessage(recipient, text), timeoutPromise]);
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
