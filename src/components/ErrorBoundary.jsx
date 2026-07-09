import React from 'react';

const BRAND_GRADIENT = 'linear-gradient(135deg, #e2b97a 0%, #b1835a 100%)';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('Unhandled render error:', error, info?.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50" style={{ minHeight: '100dvh' }}>
                <div className="w-full lg:max-w-[400px] mx-auto flex flex-col items-center justify-center px-8 gap-5" style={{ minHeight: '100dvh' }}>
                    <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: '#fff7ed', border: '2px solid #fed7aa' }}>
                        <svg viewBox="0 0 24 24" className="w-9 h-9" fill="none">
                            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                                stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-gray-800 text-xl font-semibold">Something went wrong</p>
                        <p className="text-gray-400 text-sm">This page hit an unexpected error. Reloading usually fixes it.</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-10 py-3.5 rounded-2xl text-white font-medium text-sm shadow-lg active:scale-[0.97] transition-transform"
                        style={{ background: BRAND_GRADIENT }}
                    >
                        Reload
                    </button>
                </div>
            </div>
        );
    }
}
