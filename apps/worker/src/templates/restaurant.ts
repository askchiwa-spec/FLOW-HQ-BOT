export function getRestaurantResponse(
  message: string,
  businessName: string,
  language: 'SW' | 'EN'
): string {
  const lowerMsg = message.toLowerCase();

  if (language === 'SW') {
    if (lowerMsg.includes('menu') || lowerMsg.includes('chakula') || lowerMsg.includes('orodha')) {
      return `Karibu ${businessName}! Hapa kuna meza yetu kuu: tuma "MENU" kupata orodha kamili ya vyakula na bei zake.`;
    }
    if (lowerMsg.includes('order') || lowerMsg.includes('agiza') || lowerMsg.includes('delivery') || lowerMsg.includes('usafiri')) {
      return `Asante kwa agizo! Tafadhali taja: 1) Vyakula unavyotaka 2) Idadi 3) Anwani yako ya kupeleka.`;
    }
    if (lowerMsg.includes('meza') || lowerMsg.includes('table') || lowerMsg.includes('book') || lowerMsg.includes('hifadhi')) {
      return `Karibu kuhifadhi meza! Tafadhali tupe: jina lako, siku na saa, na idadi ya watu.`;
    }
    if (lowerMsg.includes('bei') || lowerMsg.includes('price') || lowerMsg.includes('gharama')) {
      return `Karibu ${businessName}. Bei zetu zinaanza kuanzia 5,000 TZS. Tuma "MENU" kuona bei kamili.`;
    }
    return `Karibu ${businessName}! Andika: 1) Menu 2) Agiza chakula 3) Hifadhi meza 4) Saa za kazi`;
  }

  if (lowerMsg.includes('menu') || lowerMsg.includes('food') || lowerMsg.includes('dish')) {
    return `Welcome to ${businessName}! Send "MENU" to get our full menu with prices.`;
  }
  if (lowerMsg.includes('order') || lowerMsg.includes('delivery')) {
    return `Thank you for your order! Please tell us: 1) What you'd like to order 2) Quantity 3) Delivery address.`;
  }
  if (lowerMsg.includes('table') || lowerMsg.includes('book') || lowerMsg.includes('reservation') || lowerMsg.includes('reserve')) {
    return `We'd love to have you! Please share: your name, preferred date and time, and number of guests.`;
  }
  if (lowerMsg.includes('price') || lowerMsg.includes('how much') || lowerMsg.includes('cost')) {
    return `Welcome to ${businessName}. Our meals start from 5,000 TZS. Send "MENU" for the full price list.`;
  }
  return `Welcome to ${businessName}! Reply with: 1) Menu 2) Order food 3) Book a table 4) Opening hours`;
}
