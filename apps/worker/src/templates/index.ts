import { getBookingResponse } from './booking';

export interface TemplateConfig {
  template_type: 'BOOKING' | 'ECOMMERCE' | 'SUPPORT';
  business_name: string;
  language: 'SW' | 'EN';
}

export function getResponse(
  message: string,
  config: TemplateConfig
): string {
  switch (config.template_type) {
    case 'BOOKING':
      return getBookingResponse(message, config.business_name, config.language);
    case 'ECOMMERCE':
      return getEcommerceResponse(message, config.business_name, config.language);
    case 'SUPPORT':
      return getSupportResponse(message, config.business_name, config.language);
    default:
      return getBookingResponse(message, config.business_name, config.language);
  }
}

function getEcommerceResponse(
  message: string,
  businessName: string,
  language: 'SW' | 'EN'
): string {
  const lowerMsg = message.toLowerCase();
  
  if (language === 'SW') {
    if (lowerMsg.includes('bei') || lowerMsg.includes('price') || lowerMsg.includes('gharama')) {
      return `Karibu ${businessName}. Tafadhali taja bidhaa unayotaka kujua bei.`;
    }
    if (lowerMsg.includes('order') || lowerMsg.includes('agiza')) {
      return `Karibu ${businessName}. Tafadhali taja bidhaa na idadi unayotaka.`;
    }
    return `Karibu ${businessName}. Andika: 1) Orodha ya bidhaa 2) Bei 3) Agiza 4) Usafiri`;
  }
  
  if (lowerMsg.includes('price')) {
    return `Welcome to ${businessName}. Please tell us which product you want to know the price for.`;
  }
  if (lowerMsg.includes('order')) {
    return `Welcome to ${businessName}. Please tell us what product and quantity you want to order.`;
  }
  return `Welcome to ${businessName}. Reply with: 1) Products 2) Prices 3) Order 4) Delivery`;
}

function getSupportResponse(
  message: string,
  businessName: string,
  language: 'SW' | 'EN'
): string {
  const lowerMsg = message.toLowerCase();
  
  if (language === 'SW') {
    if (lowerMsg.includes('shida') || lowerMsg.includes('tatizo') || lowerMsg.includes('problem')) {
      return `Samahani kwa usumbufu. Tafadhali elezea shida yako kwa undani tutakusaidia.`;
    }
    return `Karibu ${businessName}. Andika: 1) Shida 2) Maswali 3) Mawasiliano 4) Saa za kazi`;
  }
  
  if (lowerMsg.includes('problem') || lowerMsg.includes('issue')) {
    return `Sorry for the inconvenience. Please describe your issue in detail and we will help you.`;
  }
  return `Welcome to ${businessName}. Reply with: 1) Issues 2) Questions 3) Contact 4) Working hours`;
}
