// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { ThemedLoadingScreen } from '@/components/ui/themed-loading-screen';

export default function Loading() {
  return (
    <ThemedLoadingScreen
      message="Loading application..."
      detail="Initializing IND, medicine, and regulatory workspace resources."
    />
  );
}
