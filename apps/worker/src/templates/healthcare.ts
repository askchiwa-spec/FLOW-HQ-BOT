export function getHealthcareResponse(
  message: string,
  businessName: string,
  language: 'SW' | 'EN'
): string {
  const lowerMsg = message.toLowerCase();

  if (language === 'SW') {
    if (lowerMsg.includes('miadi') || lowerMsg.includes('appointment') || lowerMsg.includes('daktari') || lowerMsg.includes('doctor')) {
      return `Karibu ${businessName}. Tunafurahi kukusaidia kupanga miadi. Tafadhali tupe: jina lako, aina ya huduma unayohitaji, na siku unayopendelea.`;
    }
    if (lowerMsg.includes('dawa') || lowerMsg.includes('medicine') || lowerMsg.includes('prescription') || lowerMsg.includes('agizo la dawa')) {
      return `Kwa maswali ya dawa, tafadhali wasiliana na daktari wetu moja kwa moja. Tunaweza kupanga miadi ya haraka - tuma "MIADI".`;
    }
    if (lowerMsg.includes('dharura') || lowerMsg.includes('emergency') || lowerMsg.includes('urgent')) {
      return `Kwa dharura, tafadhali piga simu moja kwa moja. Kama si dharura kubwa, tunaweza kukusaidia kupanga miadi ya leo. [HUMAN_NEEDED]`;
    }
    if (lowerMsg.includes('bei') || lowerMsg.includes('gharama') || lowerMsg.includes('price')) {
      return `Gharama inategemea huduma. Mashauriano ya kawaida yanaanzia 20,000 TZS. Tuma "HUDUMA" kuona orodha kamili.`;
    }
    return `Karibu ${businessName}. Andika: 1) Panga miadi 2) Huduma zetu 3) Saa za kliniki 4) Dharura`;
  }

  if (lowerMsg.includes('appointment') || lowerMsg.includes('doctor') || lowerMsg.includes('consult')) {
    return `Welcome to ${businessName}. We're happy to book you an appointment. Please share: your name, the type of service needed, and your preferred date.`;
  }
  if (lowerMsg.includes('medicine') || lowerMsg.includes('prescription') || lowerMsg.includes('refill')) {
    return `For prescription queries, you'll need to speak with our doctor directly. We can book a quick appointment — send "APPOINTMENT".`;
  }
  if (lowerMsg.includes('emergency') || lowerMsg.includes('urgent') || lowerMsg.includes('critical')) {
    return `For emergencies, please call us directly right away. If it's non-urgent, we can book you in today. [HUMAN_NEEDED]`;
  }
  if (lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('fee')) {
    return `Fees depend on the service. General consultations start at 20,000 TZS. Send "SERVICES" to see the full list.`;
  }
  return `Welcome to ${businessName}. Reply with: 1) Book appointment 2) Our services 3) Clinic hours 4) Emergency`;
}
