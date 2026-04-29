export const formatTaka = (amount: number): string => {
  return `৳${amount.toLocaleString('en-BD')}`;
};