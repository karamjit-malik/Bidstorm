import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message?: string;
}

/**
 * App-wide error boundary: catches render/runtime errors in the React tree and
 * shows a recoverable fallback instead of a blank white screen.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : 'Unknown error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center bg-[#efedea] px-4">
        <div className="max-w-md rounded-2xl border border-black/10 bg-white p-8 text-center shadow-card">
          <h1 className="font-display text-xl text-black">Something went wrong</h1>
          <p className="mt-2 text-sm text-black/50">
            An unexpected error occurred. Try reloading the page.
          </p>
          {this.state.message && (
            <p className="mt-3 rounded-lg bg-black/[0.04] px-3 py-2 text-left font-mono text-xs text-black/60">
              {this.state.message}
            </p>
          )}
          <button
            onClick={() => window.location.assign('/')}
            className="mt-5 rounded-full border border-black bg-black px-6 py-2 font-medium text-white transition-colors hover:bg-transparent hover:text-black"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }
}
