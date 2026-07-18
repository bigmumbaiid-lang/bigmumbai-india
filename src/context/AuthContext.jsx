import { createContext, useEffect, useState } from "react";
import axios from "../utils/axios";
import { startHeartbeat, stopHeartbeat } from "../utils/heartbeat";
import SplashScreen from "../components/SplashScreen";

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

            const fetchMe = () => axios.get("/user/me");

            try {
                let res;
                try {
                    res = await fetchMe();
                } catch (err) {
                    // One retry for transient failures (flaky mobile network right after
                    // opening a new tab, brief timeout, etc.) before giving up — avoids
                    // bouncing a validly-logged-in user to /login over a single blip.
                    if (err.response?.status === 401 || err.response?.status === 403) throw err;
                    await new Promise(r => setTimeout(r, 800));
                    res = await fetchMe();
                }

                setUser(res.data.user);
                setToken(token);

            } catch (err) {
                // Only a genuine auth failure (invalid/expired token) should sign the
                // user out. A network blip, timeout, or server error here must NOT
                // wipe the token — it lives in localStorage and is shared by every
                // same-origin tab, so clearing it on a transient failure (e.g. right
                // after opening a trx/usdt payment tab on a flaky mobile connection)
                // silently logs the user out of the main app tab as well.
                const status = err.response?.status;
                if (status === 401 || status === 403) {
                    localStorage.removeItem("token");
                    setUser(null);
                    setToken(null);
                } else {
                    setToken(token);
                }
            }

            setLoading(false);
        };

        initAuth();

    }, []);

    // Run the activity heartbeat whenever we hold a session token. This covers
    // login, session-restore-on-refresh, and logout uniformly — start on token
    // present, stop when it clears, and always stop on unmount.
    useEffect(() => {
        if (token) startHeartbeat();
        else stopHeartbeat();
        return () => stopHeartbeat();
    }, [token]);

    // Update only the balance after a game action, without a full refetch.
    // Added for the Mines feature; does not change any existing behavior.
    const setBalance = (money) => {
        setUser((prev) => (prev ? { ...prev, money } : prev));
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, setUser, setBalance }}>
            {loading ? (
                // Was a bare blank screen before — on a slow/flaky connection the
                // session check can take a few seconds, which read as the app
                // being frozen. Show the branded splash instead of nothing.
                <SplashScreen />
            ) : children}
        </AuthContext.Provider>
    );
};
