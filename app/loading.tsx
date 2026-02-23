// Author: Bin Lee
// Email: binlee120@gmail.com

import { ThemedLoadingScreen } from '@/components/ui/themed-loading-screen';

export default function Loading() {
  return (
    <ThemedLoadingScreen
      message="Loading application..."
      detail="Initializing IND, medicine, and regulatory workspace resources."
    />
  );
}
