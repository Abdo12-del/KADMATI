export const formatNumberArabic = (num: number | undefined | null): string => {
  if (num === undefined || num === null) {
    return 'غير محدد';
  }
  // Use 'ar-EG' locale for Arabic numerals
  return num.toLocaleString('ar-EG');
};

export const formatCurrencyArabic = (amount: number | undefined | null, currency: string = 'DZD'): string => {
  if (amount === undefined || amount === null) {
    return 'غير محدد';
  }
  // Use 'ar-EG' locale for Arabic numerals and currency formatting
  return amount.toLocaleString('ar-EG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0, // Assuming whole numbers for DZD
    maximumFractionDigits: 0,
  });
};