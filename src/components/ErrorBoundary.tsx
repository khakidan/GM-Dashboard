import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { 
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State { 
  hasError: boolean; 
  error: Error | null; 
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    } else {
      console.error('[ErrorBoundary] caught error:', error, errorInfo);
    }
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 bg-white rounded-2xl border border-[#e2e8f0] shadow-md flex flex-col gap-4 max-w-2xl mx-auto my-8">
          <h2 className="text-xl font-bold text-[#0f172a] font-serif">Something went wrong on this page</h2>
          <p className="text-sm text-[#8d8db9]">
            The application encountered an unexpected error on this view. You can try resetting the page state or reloading the entire application.
          </p>
          {this.state.error && (
            <pre className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-700 overflow-x-auto select-text">
              {this.state.error.message || String(this.state.error)}
            </pre>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              id="eb-try-again"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-[#2563eb] hover:bg-[#567eff] text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
            >
              Try Again
            </button>
            <button
              id="eb-reload-app"
              onClick={() => window.location.reload()}
              className="bg-[#8d8db9] hover:bg-[#3f3f37] text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
