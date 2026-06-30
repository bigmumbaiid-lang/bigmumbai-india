// components/RequireBankCard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import toast from 'react-hot-toast';

export default function RequireBankCard({ children }) {
    const navigate = useNavigate();
    const [ok, setOk] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get('/bank-card/get-bank-card');
                const card = res.data?.data;
                if (card && card.bankAccount) {
                    setOk(true);
                } else {
                    toast.error('Please add a bank card first');
                    navigate('/account-security', { replace: true });
                }
            } catch {
                navigate('/account-security', { replace: true });
            } finally {
                setChecking(false);
            }
        })();
    }, [navigate]);

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <span className="w-6 h-6 border-2 border-gray-200 border-t-[#d8ab83] rounded-full animate-spin" />
            </div>
        );
    }
    return ok ? children : null;
}