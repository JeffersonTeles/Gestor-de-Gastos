import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-full flex flex-col items-center justify-center p-8 bg-zinc-950 text-white">
                    <h1 className="text-3xl font-bold text-rose-500 mb-4">Algo deu errado :(</h1>
                    <div className="bg-black/50 p-6 rounded-xl border border-rose-900/50 max-w-2xl w-full">
                        <p className="font-mono text-sm text-rose-200 mb-4 whitespace-pre-wrap">
                            {this.state.error?.toString()}
                        </p>
                        <p className="text-zinc-500 text-sm">
                            Verifique o console do navegador para mais detalhes.
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-bold transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
