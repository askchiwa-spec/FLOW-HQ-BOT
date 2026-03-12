export function getHotelResponse(
  message: string,
  businessName: string,
  language: 'SW' | 'EN'
): string {
  const lowerMsg = message.toLowerCase();

  if (language === 'SW') {
    if (lowerMsg.includes('chumba') || lowerMsg.includes('room') || lowerMsg.includes('kaunta') || lowerMsg.includes('availability')) {
      return `Karibu ${businessName}. Tuna aina mbalimbali za vyumba: Standard, Deluxe, na Family Room. Tafadhali tupe: tarehe ya kuwasili, tarehe ya kuondoka, na idadi ya wageni.`;
    }
    if (lowerMsg.includes('bei') || lowerMsg.includes('price') || lowerMsg.includes('gharama')) {
      return `Karibu ${businessName}. Bei zinategemea aina ya chumba na tarehe. Tafadhali tupe tarehe yako ili tukupe bei sahihi.`;
    }
    if (lowerMsg.includes('book') || lowerMsg.includes('hifadhi') || lowerMsg.includes('ombi')) {
      return `Asante kwa kupendezwa! Tafadhali tupe: jina lako kamili, namba ya simu, tarehe ya kuwasili, tarehe ya kuondoka, na idadi ya wageni. Timu yetu itakuthibitishia hivi karibuni.`;
    }
    if (lowerMsg.includes('mahali') || lowerMsg.includes('location') || lowerMsg.includes('anwani') || lowerMsg.includes('address')) {
      return `${businessName} iko [Weka anwani hapa]. Karibu na [Alama ya karibu]. Tuma "BOOKING" kuanza mchakato wa kuhifadhi chumba.`;
    }
    return `Karibu ${businessName}. Andika: 1) Angalia vyumba 2) Ombi la kuhifadhi 3) Bei 4) Mahali 5) Wasiliana na mapokezi`;
  }

  if (lowerMsg.includes('room') || lowerMsg.includes('availability') || lowerMsg.includes('check')) {
    return `Welcome to ${businessName}. We have Standard, Deluxe, and Family Rooms available. Please share: check-in date, check-out date, and number of guests.`;
  }
  if (lowerMsg.includes('price') || lowerMsg.includes('rate') || lowerMsg.includes('cost') || lowerMsg.includes('how much')) {
    return `Welcome to ${businessName}. Rates depend on room type and dates. Please share your dates and we'll give you an accurate quote.`;
  }
  if (lowerMsg.includes('book') || lowerMsg.includes('reserve') || lowerMsg.includes('request')) {
    return `Thank you for your interest! Please share: full name, phone number, check-in date, check-out date, and number of guests. Our reception team will confirm availability shortly.`;
  }
  if (lowerMsg.includes('location') || lowerMsg.includes('address') || lowerMsg.includes('where') || lowerMsg.includes('directions')) {
    return `${businessName} is located at [Add address here]. Nearby landmarks: [Add landmarks]. Send "BOOK" to start a booking request.`;
  }
  return `Welcome to ${businessName}. Reply with: 1) Check rooms 2) Booking request 3) Rates 4) Location 5) Talk to reception`;
}
