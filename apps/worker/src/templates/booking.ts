export function getBookingResponse(
  message: string, 
  businessName: string, 
  language: 'SW' | 'EN'
): string {
  const lowerMsg = message.toLowerCase();
  const isBookingIntent = ['book', 'booking', 'miadi', 'huduma', 'service'].some(k => lowerMsg.includes(k));
  
  if (language === 'SW') {
    if (isBookingIntent) {
      return `Karibu ${businessName}. Tafadhali taja huduma unayotaka na tarehe (mf: Facial, 26 Feb).`;
    }
    return `Karibu ${businessName}. Andika: 1) Booking 2) Huduma 3) Bei 4) Mawasiliano`;
  }
  
  // English
  if (isBookingIntent) {
    return `Welcome to ${businessName}. Please tell us what service you want and the date (e.g., Facial, Feb 26).`;
  }
  return `Welcome to ${businessName}. Reply with: 1) Booking 2) Services 3) Prices 4) Contact`;
}
