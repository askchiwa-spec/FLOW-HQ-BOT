export function getRealEstateResponse(
  message: string,
  businessName: string,
  language: 'SW' | 'EN'
): string {
  const lowerMsg = message.toLowerCase();

  if (language === 'SW') {
    if (lowerMsg.includes('nyumba') || lowerMsg.includes('property') || lowerMsg.includes('plot') || lowerMsg.includes('kiwanja')) {
      return `Karibu ${businessName}. Tuna mali mbalimbali za kupanga au kuuza. Tafadhali taja: 1) Aina (nyumba/kiwanja) 2) Eneo 3) Bei unayotarajia.`;
    }
    if (lowerMsg.includes('bei') || lowerMsg.includes('price') || lowerMsg.includes('gharama')) {
      return `Karibu ${businessName}. Bei inategemea eneo na aina ya mali. Tafadhali tueleze unatafuta nini ili tukusaidie vizuri.`;
    }
    if (lowerMsg.includes('ona') || lowerMsg.includes('tembelea') || lowerMsg.includes('viewing') || lowerMsg.includes('tour')) {
      return `Asante kwa kupendezwa! Tunaweza kupanga ziara ya kuona mali. Tafadhali tupe: jina lako, namba ya simu, na siku unayopendelea.`;
    }
    return `Karibu ${businessName}. Andika: 1) Orodha ya mali 2) Bei 3) Panga ziara 4) Mawasiliano`;
  }

  if (lowerMsg.includes('property') || lowerMsg.includes('house') || lowerMsg.includes('plot') || lowerMsg.includes('land')) {
    return `Welcome to ${businessName}. We have various properties for sale and rent. Please specify: 1) Type (house/plot) 2) Location 3) Budget range.`;
  }
  if (lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('how much')) {
    return `Welcome to ${businessName}. Prices depend on location and property type. Tell us what you're looking for and we'll give you a tailored quote.`;
  }
  if (lowerMsg.includes('view') || lowerMsg.includes('visit') || lowerMsg.includes('tour')) {
    return `Great interest! We can arrange a property viewing. Please share your name, phone number, and preferred date.`;
  }
  return `Welcome to ${businessName}. Reply with: 1) Listings 2) Prices 3) Book a viewing 4) Contact us`;
}
