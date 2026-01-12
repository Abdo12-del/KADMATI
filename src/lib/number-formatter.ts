export const formatNumberArabic = (num: number | undefined | null): string => {
  if (num === undefined || num === null) {
    return 'غير محدد';
  }
  // Explicitly use 'en-US' locale for Western Arabic numerals
  return num.toLocaleString('en-US');
};

export const formatCurrencyArabic = (amount: number | undefined | null, currency: string = 'DZD'): string => {
  if (amount === undefined || amount === null) {
    return 'غير محدد';
  }
  // Explicitly use 'en-US' locale for Western Arabic numerals and currency formatting
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0, // Assuming whole numbers for DZD
    maximumFractionDigits: 0,
  });
};