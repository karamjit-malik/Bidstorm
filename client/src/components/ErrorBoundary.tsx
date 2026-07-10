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
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            An unexpected error occurred. Try reloading the page.
          </p>
          {this.state.message && (
            <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-left font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {this.state.message}
            </p>
          )}
          <button
            onClick={() => window.location.assign('/')}
            className="mt-5 rounded-lg bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }
}
