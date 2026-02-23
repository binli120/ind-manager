// Author: Bin Lee
// Email: binlee120@gmail.com

export const extractSectionNumber = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/^(\d+(?:\.\d+)*)(?:[^\d.]|$)/);
  return match ? match[1] : null;
};

