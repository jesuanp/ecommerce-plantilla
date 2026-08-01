export const formatPrice = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const calculateShipping = (subtotal: number): number => {
  return subtotal > 100 ? 0 : 9.99;
};

export const calculateTax = (subtotal: number, rate = 0.08): number => {
  return subtotal * rate;
};
