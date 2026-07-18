import React, { useContext, useState } from 'react';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import logo from './assets/logo.jpg';
import Link from '@mui/material/Link';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import SplashScreen from './components/SplashScreen';

const BRAND_GRADIENT = 'linear-gradient(135deg, rgb(217,173,130) 0%, rgb(177,131,90) 100%)';

function Login() {
    const [data, setData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSplash, setShowSplash] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleInput = (e) => {
        setError('');
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!data.username.trim()) {
            setError('Please enter your username');
            return;
        }
        if (!data.password) {
            setError('Please enter your password');
            return;
        }

        setLoading(true);
        try {
            await login({
                username: data.username.trim(),
                password: data.password,
            });
            // Show the branded splash as the transition into the app; it navigates
            // home once its art has painted (see onReady below).
            setShowSplash(true);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    'Login failed. Please check your credentials and try again.'
            );
            setLoading(false);
        }
    };

    if (showSplash) {
        return <SplashScreen onReady={() => navigate('/', { replace: true })} />;
    }

    const fieldWrap =
        'flex items-center gap-3 px-4 rounded-2xl border-2 border-gray-200 bg-white transition-all focus-within:border-[#b1835a] focus-within:ring-4 focus-within:ring-[#d8ab83]/20';

    const iconChip = 'w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#f0e0c6]';

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-white"
            style={{ minHeight: '100dvh' }}
        >
            <div className="w-full lg:max-w-[400px] mx-auto min-h-screen flex flex-col shadow-2xl border bg-white border-gray-300">
                {/* Header */}
                <div
                    className="h-14 flex items-center px-4 shrink-0"
                    style={{ background: BRAND_GRADIENT }}
                >
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        aria-label="Go back"
                        className="flex items-center text-white"
                    >
                        <ArrowBackIosIcon fontSize="small" />
                        <p className="text-lg ml-1">Log in</p>
                    </button>
                    <img src={logo} className="w-24 ml-auto" alt="Big Mumbai" />
                </div>

                {/* Form */}
                <div className="px-5 pt-6">
                    {error && (
                        <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200">
                            <p className="text-sm font-medium text-red-600 text-center">{error}</p>
                        </div>
                    )}
                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>

                        {/* Username */}
                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Username</label>
                            <div className={fieldWrap}>
                                <div className={iconChip}>
                                    <User size={16} className="text-[#b1835a]" />
                                </div>
                                <input
                                    name="username"
                                    id="username"
                                    value={data.username}
                                    onChange={handleInput}
                                    autoComplete="username"
                                    className="flex-1 py-3.5 bg-transparent text-[15px] text-gray-800 outline-none placeholder-gray-400"
                                    placeholder="Username"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Password</label>
                            <div className={fieldWrap}>
                                <div className={iconChip}>
                                    <Lock size={16} className="text-[#b1835a]" />
                                </div>
                                <input
                                    name="password"
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={handleInput}
                                    autoComplete="current-password"
                                    className="flex-1 py-3.5 bg-transparent text-[15px] text-gray-800 outline-none placeholder-gray-400"
                                    placeholder="Password"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 shrink-0"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        {/* Login button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 py-4 rounded-2xl text-white font-semibold text-[15px] shadow-lg shadow-[#b1835a]/25 transition-all active:scale-[0.98] disabled:opacity-60 disabled:shadow-none flex items-center justify-center gap-2"
                            style={{ background: BRAND_GRADIENT }}
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Logging in…
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>
                </div>

                {/* Register link */}
                <p className="text-center text-sm text-gray-500 pt-4">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="!text-[#b1835a] font-semibold !no-underline">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
