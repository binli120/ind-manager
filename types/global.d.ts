// src/types/global.d.ts
// Author: Bin Lee
// Email: binlee120@gmail.com

import type * as Sentry from "@sentry/browser"; // or '@sentry/react' if you use the React SDK

declare global {
    interface Window {
        /** Optional, because it may not be injected in dev env. */
        Sentry?: typeof Sentry;
    }
}
