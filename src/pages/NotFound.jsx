import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dices } from 'lucide-react';
import bigMumbaiLogo from '../assets/bigMumbaiLogo.png';

const BRAND_GRADIENT = 'linear-gradient(135deg, #e2b97a 0%, #b1835a 100%)';
const BRAND_C        = '#b1835a';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-center min-h-screen" style={{ minHeight: '100dvh', background: '#f8fafc' }}>
            <div
                className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-200 relative"
                style={{ height: '100dvh', background: '#f8fafc' }}
            >
                {/* Ambient backdrop glow */}
                <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full opacity-25 blur-3xl pointer-events-none" style={{ background: BRAND_GRADIENT }} />
                <div className="absolute bottom-0 -right-20 w-56 h-56 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: BRAND_GRADIENT }} />

                <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10 text-center">
                    <img src={bigMumbaiLogo} alt="Big Mumbai" className="h-8 mb-8 opacity-90 object-contain" />

                    {/* Illustration */}
                    <div className="relative mb-5">
                        <div className="absolute inset-0 rounded-full opacity-30 blur-2xl" style={{ background: BRAND_GRADIENT }} />
                        <div
                            className="relative w-28 h-28 rounded-full flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg,#fdf0e2,#f3dcb8)', boxShadow: '0 10px 26px rgba(177,131,90,0.2)' }}
                        >
                            <Dices size={46} strokeWidth={1.6} style={{ color: BRAND_C }} />
                        </div>
                    </div>

                    <p
                        className="font-extrabold tracking-tight leading-none"
                        style={{
                            fontSize: 68,
                            backgroundImage: BRAND_GRADIENT,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        404
                    </p>

                    <p className="text-gray-800 text-lg font-bold mt-2">Page Not Found</p>
                    <p className="text-gray-400 text-sm mt-2 leading-relaxed max-w-[260px]">
                        The page you're looking for doesn't exist or may have been moved.
                    </p>

                    <button
                        onClick={() => navigate('/')}
                        className="mt-8 w-full py-3.5 rounded-2xl text-white font-semibold shadow-lg active:scale-[0.98] transition-transform"
                        style={{ background: BRAND_GRADIENT, boxShadow: '0 10px 24px rgba(177,131,90,0.3)' }}
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}
