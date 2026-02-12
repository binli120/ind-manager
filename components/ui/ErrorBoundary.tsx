// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import React, { Component } from 'react';

type ErrorBoundaryProps = {
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null; // ← this is the key change
};

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null }; // initial state matches type
  }

  static getDerivedStateFromError(err: unknown): Partial<ErrorBoundaryState> {
    return { hasError: true, error: err as Error };
  }

  render() {
    const { hasError, error } = this.state;
    const { fallback, children } = this.props;

    if (hasError) {
      return (
        <div role='alert' style={{ padding: '1rem', background: '#fee' }}>
          <h2>Something went wrong.</h2>
          {/* Now TS knows `error` is an Error or null */}
          <pre>{error?.message ?? 'Unknown error'}</pre>
          {fallback}
        </div>
      );
    }

    return children;
  }
}
