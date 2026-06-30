import { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axios";
import { AuthContext } from "../context/AuthContext";
import { toDisplay, toUnits, formatMultiplier } from "../utils/money";
import MinesGrid from "../components/MinesGrid";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";

const GRID_SIZE = 25;
const QUICK_AMOUNTS = [100, 500, 1000, 5000];

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

  const isPlaying = status === "active";
  const isFinished = status === "won" || status === "lost" || status === "cashed_out";

  const inr = (val) =>
    Number(val).toLocaleString("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });

  const historyMultipliers = (() => {
    const vals = historyBar.map((g) => g.multiplier);
    const ordered = [...vals].reverse();
    const padded = [];
    for (let i = 0; i < 5; i++) {
      const idx = ordered.length - 5 + i;
      padded.push(idx >= 0 ? ordered[idx] : null);
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
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-3 pb-4 bg-[#fafafa]" style={{ WebkitOverflowScrolling: "touch" }}>

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
                  className={`rounded-lg py-1.5 text-center text-xs font-bold border ${
                    lost
                      ? "bg-red-50 text-red-500 border-red-200"
                      : "bg-emerald-50 text-emerald-600 border-emerald-200"
                  }`}
                >
                  {m.toFixed(2)}x
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-3">
          <MinesGrid
            revealedTiles={revealedTiles}
            mineHits={mineHits}
            onTileClick={handleReveal}
            disabled={!isPlaying || loading}
            gridSize={GRID_SIZE}
          />
        </div>

        {/* Status banners */}
        {isPlaying && nextMultiplier !== null && (
          <div className="bg-[#fff7ee] border border-[#f0dcc2] rounded-xl px-3 py-2 text-center text-xs mb-2 text-gray-600">
            Next tile:{" "}
            <span className="text-[#ee7d1b] font-bold">
              ₹{inr(toDisplay(Math.floor(toUnits(betAmountInput) * nextMultiplier)))} ({formatMultiplier(nextMultiplier)})
            </span>
          </div>
        )}

        {status === "won" && (
          <div className="bg-emerald-50 border border-emerald-400 rounded-xl px-3 py-2 text-center text-xs mb-2 font-bold text-emerald-700">
            🎉 You won! ₹{inr(toDisplay(payout))} ({formatMultiplier(currentMultiplier)})
          </div>
        )}

        {status === "lost" && (
          <div className="bg-red-50 border border-red-400 rounded-xl px-3 py-2 text-center text-xs mb-2 font-bold text-red-600">
            💥 You hit a mine. Better luck next time.
          </div>
        )}

        {status === "cashed_out" && (
          <div className="bg-emerald-50 border border-emerald-400 rounded-xl px-3 py-2 text-center text-xs mb-2 font-bold text-emerald-700">
            ✅ Cashed out! ₹{inr(toDisplay(payout))} ({formatMultiplier(currentMultiplier)})
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-600 rounded-xl px-3 py-2 text-xs mb-2">
            {error}
          </div>
        )}

        {/* Main action button */}
        {isPlaying ? (
          <button
            onClick={handleCashOut}
            disabled={loading || revealedTiles.length === 0}
            className="w-full text-white font-bold rounded-xl py-3.5 mb-3 text-sm shadow-md disabled:opacity-50 transition-opacity"
            style={{ background: "linear-gradient(160deg,#f0b15a,#d18a2c)" }}
          >
            Cash Out &nbsp;₹{inr(toDisplay(payout || toUnits(betAmountInput)))}
          </button>
        ) : (
          <button
            onClick={isFinished ? resetBoard : handleStart}
            disabled={loading}
            className="w-full text-white font-bold rounded-xl py-3.5 mb-3 text-sm shadow-md disabled:opacity-50 transition-all active:scale-[0.99]"
            style={{ background: "linear-gradient(160deg,#ff9f43,#ee7d1b)" }}
          >
            {isFinished ? "Play Again" : loading ? "Starting…" : "Bet"}
          </button>
        )}

        {/* Amount input */}
        <label className="block text-xs text-gray-500 font-medium mb-1">Amount</label>
        <div className="bg-white border border-gray-200 rounded-xl flex items-center px-3 py-2.5 mb-2 focus-within:border-[#d9ad82] transition-colors">
          <span className="mr-2 text-sm text-[#c9912f] font-bold">₹</span>
          <input
            type="text"
            value={betAmountInput}
            onChange={(e) => setBetAmountInput(e.target.value)}
            disabled={isPlaying}
            className="bg-transparent flex-1 outline-none text-sm text-gray-800 disabled:opacity-50 font-mono"
            placeholder="100"
          />
          <button
            disabled={isPlaying}
            onClick={() => setBetAmountInput((v) => (parseFloat(v) / 2 || 0).toString())}
            className="text-xs text-gray-500 hover:text-[#a96e35] px-2 border-l border-gray-200 ml-1 disabled:opacity-40 transition-colors"
          >
            1/2
          </button>
          <button
            disabled={isPlaying}
            onClick={() => setBetAmountInput((v) => (parseFloat(v) * 2 || 0).toString())}
            className="text-xs text-gray-500 hover:text-[#a96e35] px-2 disabled:opacity-40 transition-colors"
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
            className="flex-1 disabled:opacity-50"
            style={{ accentColor: "#ee7d1b" }}
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