import { createContext, useEffect, useState } from "react";
import axios from "../utils/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // LOGIN
    const login = async (loginData) => {
        try {
            const deviceHints = {
                screenW: window.screen?.width,
                screenH: window.screen?.height,
                dpr:     window.devicePixelRatio || 1,
            };

            // Collect true OS version + device model from UA Client Hints API.
            // This API is supported by Chrome/Edge and reports real values even
            // when the UA string is frozen (e.g. iOS Safari reports iOS 18.7
            // for all versions ≥ iOS 26 due to Apple's UA privacy freeze).
            try {
                if (navigator.userAgentData?.getHighEntropyValues) {
                    const ch = await navigator.userAgentData.getHighEntropyValues([
                        'model', 'platform', 'platformVersion',
                    ]);
                    if (ch.platformVersion) deviceHints.platformVersion = ch.platformVersion;
                    if (ch.model)           deviceHints.model           = ch.model;
                    if (ch.platform)        deviceHints.platform        = ch.platform;
                }
            } catch (_) { /* API not available (Safari) */ }

            const response = await axios.post("/user/login", { ...loginData, deviceHints });

            const { token, user } = response.data;

            localStorage.setItem("token", token);

            setToken(token);
            setUser(user);

            return response.data;

        } catch (error) {
            throw error;
        }
    };

    // LOGOUT
    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
    };

    // RESTORE SESSION ON REFRESH
    useEffect(() => {

        const initAuth = async () => {

            const token = localStorage.getItem("token");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await axios.get("/user/me");

                setUser(res.data.user);
                setToken(token);

            } catch (err) {
                localStorage.removeItem("token");
                setUser(null);
                setToken(null);
            }

            setLoading(false);
        };

        initAuth();

    }, []);

    // Update only the balance after a game action, without a full refetch.
    // Added for the Mines feature; does not change any existing behavior.
    const setBalance = (money) => {
        setUser((prev) => (prev ? { ...prev, money } : prev));
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, setUser, setBalance }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
