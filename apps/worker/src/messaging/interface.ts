export interface OutboundResult {
  messageId: string;
}

/**
 * Provider-agnostic messaging interface.
 * Swap the adapter (wwebjs → Cloud API) without touching bot logic.
 */
export interface MessagingAdapter {
  sendMessage(to: string, text: string): Promise<OutboundResult>;
  sendTypingIndicator(to: string): Promise<void>;
}
