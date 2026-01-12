export const formatNumberArabic = (num: number | undefined | null): string => {
  if (num === undefined || num === null) {
    return 'غير محدد';
  }
  // Use default locale for Western Arabic numerals
  return num.toLocaleString();
};

export const formatCurrencyArabic = (amount: number | undefined | null, currency: string = 'DZD'): string => {
  if (amount === undefined || amount === null) {
    return 'غير محدد';
  }
  // Use default locale for Western Arabic numerals and currency formatting
  return amount.toLocaleString(undefined, { // Use undefined to default to browser's locale, which typically uses Western Arabic numerals
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0, // Assuming whole numbers for DZD
    maximumFractionDigits: 0,
  });
};