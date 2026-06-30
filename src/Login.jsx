import React, { useContext, useState } from 'react';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { User, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import logo from './assets/logo.jpg';
import Link from '@mui/material/Link';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

const BRAND_GRADIENT = 'linear-gradient(90deg, rgb(217,173,130), rgb(177,131,90))';

function Login() {
    const [data, setData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleInput = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

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
            navigate('/');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Login failed. Please check your credentials and try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const fieldWrap =
        'flex items-center gap-2.5 px-3.5 rounded-xl border border-gray-200 bg-white transition-all focus-within:border-[#b1835a] focus-within:ring-2 focus-within:ring-[#d8ab83]/30';

    return (
        <div className="min-h-screen bg-white flex justify-center">
            <div className="w-full md:w-[400px] min-h-screen bg-[#faf9f9] flex flex-col">

                {/* Header */}
                <div className="h-14 flex items-center px-4" style={{ background: BRAND_GRADIENT }}>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex items-center text-white"
                    >
                        <ArrowBackIosIcon fontSize="small" />
                        <p className="text-lg">Log in</p>
                    </button>
                    <img src={logo} className="w-28 ml-auto" alt="logo" />
                </div>

                <form className="flex flex-col gap-4 mt-6 px-4" onSubmit={handleSubmit}>

                    {/* Error banner */}
                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2.5 text-sm animate-fadeIn">
                            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Username */}
                    <div>
                        <label className="text-sm font-medium text-gray-600 mb-1.5 block">Username</label>
                        <div className={fieldWrap}>
                            <User size={18} className="text-[#b1835a]" />
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
                            <Lock size={18} className="text-[#b1835a]" />
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
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
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
                        className="mt-2 py-4 rounded-xl text-white font-semibold text-[15px] shadow-lg shadow-[#b1835a]/25 transition-all active:scale-[0.98] disabled:opacity-60 disabled:shadow-none flex items-center justify-center gap-2"
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

                    {/* Register link */}
                    <Link
                        href="/register"
                        className="block bg-white border border-[#d8ab83] !text-[#b1835a] !no-underline hover:!no-underline py-3.5 px-6 rounded-xl text-center font-semibold transition-colors hover:bg-[#fff7ef]"
                    >
                        Register
                    </Link>
                </form>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
            `}</style>
        </div>
    );
}

export default Login;