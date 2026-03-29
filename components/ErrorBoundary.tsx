import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
                    <div className="glass-dark rounded-3xl p-10 max-w-lg w-full text-center shadow-elevated border border-white/10">
                        {/* Icon */}
                        <div className="inline-flex items-center justify-center mb-6">
                            <div className="h-20 w-20 bg-gradient-to-br from-red-500 to-red-700 rounded-3xl flex items-center justify-center shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                        </div>

                        <h1 className="font-display text-3xl font-bold text-white mb-3">Something Went Wrong</h1>
                        <p className="text-surface-400 text-sm mb-6 leading-relaxed">
                            An unexpected error occurred. This has been logged and we'll look into it.
                        </p>

                        {/* Error details (collapsed by default) */}
                        {this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="text-xs text-surface-500 cursor-pointer hover:text-surface-400 transition-colors font-semibold uppercase tracking-wide">
                                    Technical Details
                                </summary>
                                <pre className="mt-3 p-4 bg-white/5 rounded-xl text-xs text-red-400 overflow-auto max-h-40 border border-white/5 font-mono">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleGoHome}
                                className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all border border-white/10 hover:border-white/20 text-sm"
                            >
                                Go to Dashboard
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="flex-1 py-3.5 bg-gradient-to-r from-accent-teal to-deepal-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-glow-teal text-sm"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
