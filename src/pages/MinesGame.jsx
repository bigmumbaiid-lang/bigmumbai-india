import { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axios";
import { AuthContext } from "../context/AuthContext";
import { toDisplay, toUnits, formatMultiplier } from "../utils/money";
import MinesGrid from "../components/MinesGrid";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";

const GRID_SIZE = 25;
const MAX_BET = 100000;
const QUICK_AMOUNTS = [100, 1000, 2000,5000];

export default function MinesGame() {
  const { user, setBalance } = useContext(AuthContext);
  const navigate = useNavigate();

  const [gameId, setGameId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [revealedTiles, setRevealedTiles] = useState([]);
  const [mineHits, setMineHits] = useState([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [nextMultiplier, setNextMultiplier] = useState(null);
  const [payout, setPayout] = useState(0);

  const [betAmountInput, setBetAmountInput] = useState("100");
  const [minesCount, setMinesCount] = useState(4);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bettingDisabled, setBettingDisabled] = useState(false);
  const [bettingMsg, setBettingMsg] = useState("");

  const [historyBar, setHistoryBar] = useState([]);

  const fetchHistoryBar = useCallback(async () => {
    try {
      const { data } = await axios.get("/mines/history-bar");
      if (data.results) setHistoryBar(data.results);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const { data } = await axios.get("/mines/active");
        if (data.active) {
          setGameId(data.gameId);
          setStatus("active");
          setRevealedTiles(data.revealedTiles);
          setCurrentMultiplier(data.currentMultiplier);
          setNextMultiplier(data.nextMultiplier);
          setMinesCount(data.minesCount);
          setBetAmountInput(toDisplay(data.betAmount));
        }
      } catch {
        // ignore
      }
    };
    if (user) {
      fetchActive();
      fetchHistoryBar();
    }
  }, [user, fetchHistoryBar]);

  const resetBoard = () => {
    setGameId(null);
    setStatus("idle");
    setRevealedTiles([]);
    setMineHits([]);
    setCurrentMultiplier(1);
    setNextMultiplier(null);
    setPayout(0);
    setError("");
  };

  const handleStart = useCallback(async () => {
    setError("");
    const betUnits = toUnits(betAmountInput);
    if (isNaN(betUnits) || betUnits <= 0) { setError("Enter a valid bet amount"); return; }
    if (betUnits > MAX_BET) { setError("Maximum bet is ₹100,000"); return; }
    if (user && betUnits > user.money) { setError("Insufficient balance"); return; }
    setLoading(true);
    try {
      const { data } = await axios.post("/mines/start", {
        betAmount: betUnits,
        minesCount: Number(minesCount),
      });
      setGameId(data.gameId);
      setStatus("active");
      setRevealedTiles([]);
      setMineHits([]);
      setCurrentMultiplier(1);
      setNextMultiplier(null);
      setPayout(0);
      setBalance(data.balance);
    } catch (err) {
      if (err.response?.status === 403) {
        setBettingMsg(err.response.data?.message || "Betting has been disabled for your account.");
        setBettingDisabled(true);
      } else {
        setError(err.response?.data?.message || "Failed to start game");
      }
    } finally {
      setLoading(false);
    }
  }, [betAmountInput, minesCount, user, setBalance]);

  const handleReveal = useCallback(
    async (tileIndex) => {
      if (status !== "active" || loading) return;
      setError("");
      setLoading(true);
      try {
        const { data } = await axios.post("/mines/reveal", { gameId, tileIndex });
        if (data.result === "mine") {
          setMineHits(data.minePositions);
          setRevealedTiles(data.revealedTiles);
          setStatus("lost");
          setCurrentMultiplier(0);
          setPayout(0);
          fetchHistoryBar();
        } else {
          setRevealedTiles(data.revealedTiles);
          setCurrentMultiplier(data.currentMultiplier);
          setNextMultiplier(data.nextMultiplier);
          setPayout(data.payout);
          if (data.status === "won") {
            setStatus("won");
            setMineHits(data.minePositions || []);
            if (data.balance !== undefined) setBalance(data.balance);
            fetchHistoryBar();
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to reveal tile");
      } finally {
        setLoading(false);
      }
    },
    [gameId, status, loading, setBalance, fetchHistoryBar]
  );

  const handleCashOut = useCallback(async () => {
    if (status !== "active" || loading) return;
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post("/mines/cashout", { gameId });
      setStatus("cashed_out");
      setPayout(data.payout);
      setCurrentMultiplier(data.multiplier);
      setMineHits(data.minePositions || []);
      setBalance(data.balance);
      fetchHistoryBar();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cash out");
    } finally {
      setLoading(false);
    }
  }, [gameId, status, loading, setBalance, fetchHistoryBar]);

  const handlePickRandom = useCallback(() => {
    if (status !== "active" || loading) return;
    const taken = new Set([...revealedTiles, ...mineHits]);
    const choices = [];
    for (let i = 0; i < GRID_SIZE; i++) if (!taken.has(i)) choices.push(i);
    if (choices.length === 0) return;
    const idx = choices[Math.floor(Math.random() * choices.length)];
    handleReveal(idx);
  }, [status, loading, revealedTiles, mineHits, handleReveal]);

  const isPlaying = status === "active";
  const isFinished = status === "won" || status === "lost" || status === "cashed_out";

  const inr = (val) =>
    Number(val).toLocaleString("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });

  const historyMultipliers = (() => {
    // Server returns games most-recent-first, so index 0 = latest match.
    // Show newest on the LEFT, oldest on the right; pad empty slots on the right.
    const vals = historyBar.map((g) => g.multiplier);
    const padded = [];
    for (let i = 0; i < 5; i++) {
      padded.push(i < vals.length ? vals[i] : null);
    }
    return padded;
  })();

  return (
    <div className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-200 bg-white" style={{ height: "100dvh" }}>

      {/* ── Header (caramel gradient) ── */}
      <div
        className="grid grid-cols-3 items-center px-3 py-3 sticky top-0 z-10 text-white"
        style={{ background: "linear-gradient(90deg,#d9ad82,#b1835a)" }}
      >
        <div className="flex items-center">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 flex items-center justify-center transition-colors"
            aria-label="Go back"
          >
            <ArrowBackIosIcon fontSize="small" sx={{ marginLeft: "4px" }} />
          </button>
        </div>

        <div className="flex justify-center">
          <h1 className="text-sm font-bold tracking-[0.25em] uppercase">Mines</h1>
        </div>

        <div className="flex justify-end">
          <div className="flex items-center gap-1 bg-white/20 rounded-lg px-2.5 py-1.5">
            <span className="font-bold text-sm leading-none">₹</span>
            <span className="font-semibold text-sm font-mono leading-none tracking-wide">
              {user ? inr(toDisplay(user.money)) : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Scrollable game content ── */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-3 pt-3 pb-4"
        style={{
          WebkitOverflowScrolling: "touch",
          background:
            "radial-gradient(120% 60% at 50% -10%, #fff5e9 0%, transparent 55%), linear-gradient(180deg,#f7f8fa 0%,#eef0f4 100%)",
        }}
      >

        {/* Recent results */}
        <div className="mb-3">
          <span className="block text-[11px] text-gray-400 font-medium mb-1.5">Recent results</span>
          <div className="grid grid-cols-5 gap-2">
            {historyMultipliers.map((m, i) => {
              if (m === null) {
                return (
                  <div key={i} className="rounded-lg py-1.5 text-center text-xs font-bold bg-gray-100 text-gray-300">
                    —
                  </div>
                );
              }
              const lost = m === 0;
              return (
                <div
                  key={i}
                  className={`rounded-lg py-1.5 text-center text-[11px] font-bold border ${
                    lost
                      ? "text-rose-500 border-rose-200"
                      : "text-emerald-600 border-emerald-200"
                  }`}
                  style={{
                    background: lost
                      ? "linear-gradient(180deg,#fff5f5,#ffe6e8)"
                      : "linear-gradient(180deg,#f0fdf4,#d9f7e4)",
                    boxShadow: "0 1px 2px rgba(0,0,0,.05)",
                  }}
                >
                  {m.toFixed(2)}x
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div
          className="rounded-2xl p-3.5 mb-3 border border-[#e7d9c4]"
          style={{
            background: "linear-gradient(180deg,#ffffff 0%,#fbf7f1 100%)",
            boxShadow:
              "0 10px 26px rgba(120,90,40,.10), inset 0 1px 0 rgba(255,255,255,.9)",
          }}
        >
          <MinesGrid
            revealedTiles={revealedTiles}
            mineHits={mineHits}
            onTileClick={handleReveal}
            disabled={!isPlaying || loading}
            gridSize={GRID_SIZE}
          />
        </div>

        {/* Cashout-on-next-tile pill */}
        {isPlaying && nextMultiplier !== null && (
          <div className="flex justify-center mb-3">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm bg-white border border-[#ecdfca] shadow-sm">
              <span className="text-gray-500">Cashout on next tile</span>
              <CoinIcon /> 
              <span className="font-bold text-gray-800">₹{inr(toDisplay(Math.floor(toUnits(betAmountInput) * nextMultiplier)))}</span>
              <span className="font-bold text-emerald-600">({formatMultiplier(nextMultiplier)})</span>
            </div>
          </div>
        )}

        {status === "won" && (
          <div className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs mb-2 font-bold text-emerald-700 border border-emerald-300" style={{ background: "linear-gradient(180deg,#ecfdf3,#d7f7e3)", boxShadow: "0 4px 12px rgba(16,185,129,.18)" }}>
            <TrophyIcon />
            You won&nbsp;<span className="font-extrabold">₹{inr(toDisplay(payout))}</span>&nbsp;({formatMultiplier(currentMultiplier)})
          </div>
        )}

        {status === "lost" && (
          <div className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs mb-2 font-bold text-rose-600 border border-rose-300" style={{ background: "linear-gradient(180deg,#fff1f2,#ffe0e3)", boxShadow: "0 4px 12px rgba(244,63,94,.16)" }}>
            <BurstIcon />
            Boom! You hit a mine — try again.
          </div>
        )}

        {status === "cashed_out" && (
          <div className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs mb-2 font-bold text-emerald-700 border border-emerald-300" style={{ background: "linear-gradient(180deg,#ecfdf3,#d7f7e3)", boxShadow: "0 4px 12px rgba(16,185,129,.18)" }}>
            <CheckBadgeIcon />
            Cashed out&nbsp;<span className="font-extrabold">₹{inr(toDisplay(payout))}</span>&nbsp;({formatMultiplier(currentMultiplier)})
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center gap-2 bg-rose-50 border border-rose-300 text-rose-600 rounded-xl px-3 py-2.5 text-xs mb-2">
            <WarnIcon />
            {error}
          </div>
        )}

        {/* Main action buttons */}
        {isPlaying ? (
          <>
            <button
              onClick={handleCashOut}
              disabled={loading || revealedTiles.length === 0}
              className="w-full font-bold rounded-xl py-3.5 mb-3 text-sm disabled:opacity-50 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(90deg,#e79a35 0%,#f6cd5b 100%)",
                color: "#231a02",
                boxShadow: "0 6px 18px rgba(230,161,53,.45), inset 0 1px 0 rgba(255,255,255,.45)",
              }}
            >
              Cash out <CoinIcon /> ₹{inr(toDisplay(payout || toUnits(betAmountInput)))}
            </button>
            <button
              onClick={handlePickRandom}
              disabled={loading}
              className="w-full font-bold rounded-xl py-3.5 mb-3 text-sm text-gray-700 bg-white disabled:opacity-50 transition-all active:scale-[0.99] flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50"
            >
              <WandIcon /> Pick a Tile Randomly
            </button>
          </>
        ) : (
          <button
            onClick={isFinished ? resetBoard : handleStart}
            disabled={loading}
            className="w-full font-bold rounded-xl py-3.5 mb-3 text-sm disabled:opacity-50 transition-all active:scale-[0.99]"
            style={{
              background: "linear-gradient(90deg,#2fd074 0%,#43e08a 100%)",
              color: "#052b16",
              boxShadow: "0 6px 18px rgba(47,208,116,.42), inset 0 1px 0 rgba(255,255,255,.4)",
            }}
          >
            {isFinished ? "Play Again" : loading ? "Starting…" : "Bet"}
          </button>
        )}

        {/* Amount input */}
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-500 font-medium">Amount</label>
          <span className="text-[10px] text-gray-400">Max ₹100,000</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl flex items-center px-3 py-2.5 mb-2 focus-within:border-[#d9ad82] focus-within:ring-2 focus-within:ring-[#f0dcc2] transition-all">
          <span className="mr-2 text-sm text-[#c9912f] font-bold">₹</span>
          <input
            type="text"
            inputMode="decimal"
            value={betAmountInput}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") return setBetAmountInput("");
              if (!/^\d*\.?\d*$/.test(raw)) return;
              const n = parseFloat(raw);
              if (!isNaN(n) && n > MAX_BET) return setBetAmountInput(String(MAX_BET));
              setBetAmountInput(raw);
            }}
            disabled={isPlaying}
            className="bg-transparent flex-1 outline-none text-sm text-gray-800 disabled:opacity-50 font-mono min-w-0"
            placeholder="100"
          />
          <button
            disabled={isPlaying}
            onClick={() => setBetAmountInput((v) => String(Math.max(0, Math.floor((parseFloat(v) / 2 || 0)))))}
            className="text-xs font-semibold text-gray-500 hover:text-[#a96e35] px-2 border-l border-gray-200 ml-1 disabled:opacity-40 transition-colors"
          >
            1/2
          </button>
          <button
            disabled={isPlaying}
            onClick={() => setBetAmountInput((v) => String(Math.min(MAX_BET, (parseFloat(v) * 2 || 0))))}
            className="text-xs font-semibold text-gray-500 hover:text-[#a96e35] px-2 disabled:opacity-40 transition-colors"
          >
            2x
          </button>
        </div>

        {/* Quick amounts */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              disabled={isPlaying}
              onClick={() => setBetAmountInput(String(amt))}
              className="py-1.5 rounded-lg text-xs font-semibold border border-[#ecdfca] text-[#a96e35] bg-[#fff7ee] hover:bg-[#fdeeda] active:scale-95 disabled:opacity-40 transition"
            >
              ₹{amt >= 1000 ? amt / 1000 + "K" : amt}
            </button>
          ))}
        </div>

        {/* Mines slider */}
        <label className="block text-xs text-gray-500 font-medium mb-1">
          Mines &mdash; <span className="text-[#a96e35] font-bold">{minesCount}</span>
        </label>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-gray-400 w-4 text-center">1</span>
          <input
            type="range"
            min={1}
            max={24}
            value={minesCount}
            disabled={isPlaying}
            onChange={(e) => setMinesCount(Number(e.target.value))}
            className="mines-range flex-1"
            style={{ "--fill": `${((minesCount - 1) / 23) * 100}%` }}
          />
          <span className="text-xs text-gray-400 w-5 text-center">24</span>
        </div>

      </div>

      {/* Betting disabled modal */}
      {bettingDisabled && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.65)" }}
        >
          <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl text-center overflow-hidden">
            {/* Header stripe */}
            <div className="py-4 px-6" style={{ background: "linear-gradient(160deg,#ff9f43,#ee7d1b)" }}>
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M4.93 4.93l14.14 14.14" />
                </svg>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Betting Disabled</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">{bettingMsg}</p>
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 rounded-xl text-white font-bold text-sm"
                style={{ background: "linear-gradient(160deg,#ff9f43,#ee7d1b)" }}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Banner / button icons ── */
function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#2ba24a" stroke="#1f8a3c" strokeWidth="1" />
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="15"
        fontWeight="700"
        fill="#ffffff"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
      >
        ₹
      </text>
    </svg>
  );
}
function WandIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none">
      <path d="M15 6 6 15l3 3 9-9-3-3Z" fill="#9ca3af" />
      <path d="m14.5 6.5 3 3" stroke="#fff" strokeWidth="1" />
      <path d="M5 4l.6 1.4L7 6l-1.4.6L5 8l-.6-1.4L3 6l1.4-.6L5 4Z" fill="#f5b041" />
      <path d="M18 3l.5 1.2L19.7 4.7l-1.2.5L18 6.4l-.5-1.2L16.3 4.7l1.2-.5L18 3Z" fill="#f5b041" />
      <path d="M19 11l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4.4-1Z" fill="#f5b041" />
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none">
      <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" fill="#f5b041" stroke="#d68910" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M7 5H4.5a2.5 2.5 0 0 0 2.5 2.5M17 5h2.5a2.5 2.5 0 0 1-2.5 2.5" stroke="#d68910" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10 12h4l-.5 3h-3L10 12Z" fill="#e59866" />
      <rect x="8.5" y="18" width="7" height="2" rx="1" fill="#d68910" />
      <rect x="10" y="15" width="4" height="3" fill="#e59866" />
    </svg>
  );
}
function CheckBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none">
      <path d="m12 2 2.4 1.8 3 .1 1 2.8 2.4 1.7-.9 2.9.9 2.9-2.4 1.7-1 2.8-3 .1L12 22l-2.4-1.8-3-.1-1-2.8L3.2 15l.9-2.9-.9-2.9 2.4-1.7 1-2.8 3-.1L12 2Z" fill="#10b981" />
      <path d="m8.5 12 2.3 2.3 4.7-4.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BurstIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none">
      <path d="M12 2.5 14 7l4.5-2-1.6 4.7 4.6 1.8-4.6 1.8 1.6 4.7-4.5-2-2 4.5-2-4.5-4.5 2 1.6-4.7L2.5 12.5l4.6-1.8L5.5 6 10 8l2-5.5Z" fill="#f43f5e" />
      <circle cx="12" cy="12" r="3" fill="#fff" fillOpacity="0.85" />
    </svg>
  );
}
function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none">
      <path d="M12 3 22 20H2L12 3Z" fill="#f43f5e" fillOpacity="0.15" stroke="#f43f5e" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M12 9v5" stroke="#f43f5e" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.1" fill="#f43f5e" />
    </svg>
  );
}