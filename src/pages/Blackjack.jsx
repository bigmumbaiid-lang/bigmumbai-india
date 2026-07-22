import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import axiosInstance from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

const CHIPS = [10, 25, 50, 100, 500, 1000, 2000, 5000, 10000];

const CHIP_COLORS = {
  10: '#4f8bd9',
  25: '#2aa769',
  50: '#e08a2c',
  100: '#3c4150',
  500: '#8d3a8f',
  1000: '#d98a3a',
  2000: '#1e9e8a',
  5000: '#c0392b',
  10000: 'linear-gradient(160deg,#f1d79a,#c9a24c)',
};
const chipLabel = (v) => (v >= 1000 ? v / 1000 + 'K' : String(v));
const fmt = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');

.bj, .bj * { box-sizing: border-box; margin: 0; padding: 0; }
.bj {
  font-family: 'Poppins', system-ui, sans-serif;
  width: 100%;            /* ← add this */
  height: 100vh;
  height: 100dvh;
  display: flex;
  justify-content: center;
  background: #ffffff;
  color: #20242e;
  -webkit-font-smoothing: antialiased;
}

.bj-wrap {
  width: 100%;
  max-width: 400px;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-left: 1px solid #eee;
  border-right: 1px solid #eee;
  overflow: hidden;
}

/* scrollable game body (header stays fixed on top) */
.bj-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

/* ---------- Top bar (caramel gradient — matches Mines) ---------- */
.bj-top {
  flex: 0 0 auto;
  display:grid; grid-template-columns:1fr auto 1fr; align-items:center;
  padding:12px; position:sticky; top:0; z-index:10;
  color:#fff;
  background:linear-gradient(90deg,#d9ad82,#b1835a);
}
.bj-top-l { display:flex; align-items:center; }
.bj-top-c { display:flex; justify-content:center; }
.bj-top-r { display:flex; justify-content:flex-end; }
.bj-back-btn {
  width:32px; height:32px; border-radius:50%; border:none; cursor:pointer;
  display:grid; place-items:center; flex:0 0 auto;
  background:rgba(255,255,255,.2); color:#fff;
  transition:transform .1s, background .15s;
}
.bj-back-btn:hover { background:rgba(255,255,255,.3); }
.bj-back-btn:active { transform:scale(.92); background:rgba(255,255,255,.4); }
/* MUI's ArrowBackIos has built-in right padding; nudge it to look centered */
.bj-back-btn svg { margin-left:4px; }
.bj-name { font-family:'Poppins',sans-serif; font-weight:700; letter-spacing:.25em; font-size:14px; text-transform:uppercase; color:#fff; padding-left:.25em; }
.bj-bal { display:flex; align-items:center; gap:4px; background:rgba(255,255,255,.2); border-radius:8px; padding:6px 10px; }
.bj-bal-v { font-family:'JetBrains Mono',monospace; font-weight:600; font-size:14px; line-height:1; letter-spacing:.02em; color:#fff; transition:color .25s; }
.bj-bal-v.up { color:#d8ffe0; }
.bj-bal-v.down { color:#ffe0dc; }

/* ---------- Felt table (classic emerald + gold) ---------- */
.bj-table {
  position:relative;
  border-radius:20px 20px 120px 120px;
  background:
    radial-gradient(120% 70% at 50% 0%, rgba(255,255,255,.10), transparent 52%),
    radial-gradient(150% 100% at 50% 6%, #1c9463 0%, #0f7048 46%, #0a5537 74%, #063d27 100%);
  border:2px solid #7a5a1e;
  box-shadow:
    0 0 0 4px #ffffff,
    0 0 0 6px #cba758,                        /* gold piping */
    0 0 0 7px rgba(90,62,18,.55),
    0 16px 34px rgba(6,45,28,.4),
    inset 0 2px 18px rgba(255,255,255,.14),
    inset 0 -18px 44px rgba(3,34,20,.55);
  padding:22px 16px 30px;
  overflow:hidden;
  flex:1 1 auto;
  min-height:280px;
  display:flex;
  flex-direction:column;
}
/* subtle woven-felt texture + top sheen */
.bj-table::after {
  content:""; position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(80% 45% at 50% 0%, rgba(255,255,255,.10), transparent 70%),
    repeating-linear-gradient(45deg, rgba(255,255,255,.022) 0 2px, transparent 2px 4px),
    repeating-linear-gradient(-45deg, rgba(0,0,0,.03) 0 2px, transparent 2px 4px);
}

/* ---- decorative felt print (watermark + insurance arc) ---- */
.bj-felt-deco { position:absolute; inset:0; z-index:0; pointer-events:none; }
.bj-crest {
  position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
  font-size:170px; line-height:1; color:rgba(255,255,255,.05);
  text-shadow:0 2px 10px rgba(0,0,0,.15);
}
.bj-ins-arc {
  position:absolute; left:50%; top:48%; transform:translateX(-50%);
  width:78%; height:120px;
  border:2px dashed rgba(240,224,168,.42);
  border-bottom:none;
  border-radius:220px 220px 0 0;
}
.bj-ins-text {
  position:absolute; left:50%; top:calc(48% - 12px); transform:translateX(-50%);
  color:rgba(240,224,168,.62); font-size:8px; letter-spacing:.3em;
  text-transform:uppercase; white-space:nowrap; font-weight:600;
}

.bj-arc { position:relative; z-index:1; text-align:center; margin:6px 0 4px; color:#f6e2a8; text-shadow:0 1px 3px rgba(0,0,0,.45); }
.bj-arc1 { font-family:'Poppins',sans-serif; font-weight:700; letter-spacing:.22em; font-size:12px; padding-left:.22em; color:#f8e6ad; }
.bj-arc2 { font-size:8px; letter-spacing:.2em; color:#e7cf8f; text-transform:uppercase; margin-top:5px; padding-left:.2em; opacity:.92; }
.bj-rule { width:60%; height:1px; margin:9px auto 0; background:linear-gradient(90deg,transparent,rgba(246,226,168,.85),transparent); }

.bj-seat { position:relative; z-index:1; padding:6px 4px; }
.bj-seat.player { margin-top:auto; }
.bj-head { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.bj-who { font-size:9px; letter-spacing:.24em; text-transform:uppercase; color:rgba(255,255,255,.92); font-weight:600; }
.bj-score {
  font-family:'JetBrains Mono',monospace;
  font-weight:700;
  font-size:12px;
  color:#0f5c3c;
  background:linear-gradient(160deg,#fbeec2,#f0d896);
  padding:1px 9px;
  border-radius:20px;
  min-width:26px;
  text-align:center;
  box-shadow:0 1px 3px rgba(0,0,0,.3), inset 0 0 0 1px rgba(255,255,255,.4);
  align-self: center;
  flex: 0 0 auto;
  height: 20px;
  min-height: 20px;
  line-height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.bj-score.bust { background:linear-gradient(160deg,#e8564d,#c62f28); color:#fff; }
.bj-score.bj { background:linear-gradient(160deg,#ffe9a8,#f5cf6c); color:#8a5a12; }

.bj-cards { display:flex; gap:8px; min-height:104px; align-items:flex-start; flex-wrap:wrap; }

/* ---------- Cards ---------- */
.bj-card { width:74px; height:104px; border-radius:9px; flex:0 0 auto; background:linear-gradient(150deg,#ffffff,#f6f1e7); position:relative; box-shadow:0 7px 14px rgba(4,34,20,.45),inset 0 0 0 1px rgba(0,0,0,.06),inset 0 0 0 3px rgba(255,255,255,.9); padding:6px 7px; }
.bj-card .c { font-weight:700; line-height:.95; font-size:15px; }
.bj-card .c .s { font-size:13px; display:block; margin-top:-1px; }
.bj-card .br { position:absolute; right:7px; bottom:6px; transform:rotate(180deg); }
.bj-card .mid { position:absolute; inset:0; display:grid; place-items:center; font-size:34px; opacity:.92; }
.bj-card-anim { animation:bjDeal .42s cubic-bezier(.2,.8,.25,1) both; }
@keyframes bjDeal { from{opacity:0; transform:translateY(-46px) translateX(26px) rotate(9deg) scale(.9);} to{opacity:1; transform:none;} }
.bj-flip { animation:bjFlip .55s cubic-bezier(.4,.1,.2,1) both; }
@keyframes bjFlip { from{opacity:0; transform:rotateY(90deg) scale(.96);} to{opacity:1; transform:none;} }

.bj-back { width:74px; height:104px; border-radius:9px; flex:0 0 auto; background:repeating-linear-gradient(45deg,#0f7048 0 7px,#0a5537 7px 14px); border:3px solid #ecd9a2; position:relative; box-shadow:0 7px 14px rgba(4,34,20,.5), inset 0 0 0 1px rgba(0,0,0,.15); }
.bj-back::after { content:"\\2660"; position:absolute; inset:0; display:grid; place-items:center; color:rgba(236,217,162,.85); font-size:30px; text-shadow:0 1px 2px rgba(0,0,0,.3); }

.bj-banner { text-align:center; margin:10px 0 8px; min-height:48px; }
.bj-msg { font-family:'Poppins',sans-serif; font-weight:700; letter-spacing:.06em; font-size:18px; }
.bj-msg.win { color:#d6ffe6; }
.bj-msg.lose { color:#ffd9d4; }
.bj-msg.push { color:#fbf3e4; }
.bj-delta { font-family:'JetBrains Mono',monospace; font-size:12px; color:rgba(255,255,255,.9); margin-top:2px; }

/* ---------- Controls (white card) ---------- */
.bj-ctrl { flex:0 0 auto; background:#fff; border:1px solid #ece7df; border-radius:16px; padding:14px; display:flex; flex-direction:column; gap:12px; box-shadow:0 6px 18px rgba(120,90,40,.08); }
.bj-betrow { display:flex; flex-direction:column; gap:10px; }
.bj-chips { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }
.bj-chip {
  width:50px; height:50px; border-radius:50%; cursor:pointer; border:none; position:relative;
  display:grid; place-items:center; font-family:'JetBrains Mono',monospace; font-weight:700; font-size:12px; color:#fff;
  background:#7a8b99; /* fallback so a chip is NEVER white */
  box-shadow:0 4px 8px rgba(0,0,0,.3), inset 0 0 0 4px rgba(255,255,255,.18), 0 0 0 2px rgba(177,131,90,.4);
  outline:3px dashed rgba(255,255,255,.75); outline-offset:-7px; transition:transform .12s;
}
.bj-chip:hover:not(:disabled) { transform:translateY(-3px); }
.bj-chip:active:not(:disabled) { transform:translateY(-1px) scale(.96); }
.bj-chip:disabled { opacity:.4; cursor:not-allowed; }
.bj-betbox { text-align:center; }
.bj-betbox .l { font-size:9px; letter-spacing:.18em; color:#9aa0ad; text-transform:uppercase; }
.bj-betbox .v { font-family:'JetBrains Mono',monospace; font-weight:700; font-size:22px; color:#20242e; }

/* ---------- Buttons (colorful) ---------- */
.bj-actions { display:flex; gap:9px; }
.bj-btn {
  flex:1; border:none; cursor:pointer; border-radius:12px; padding:13px 10px;
  font-family:'Poppins',sans-serif; font-weight:700; font-size:14px; letter-spacing:.02em; color:#fff;
  background:linear-gradient(160deg,#ff9f43,#ee7d1b);
  box-shadow:0 5px 14px rgba(238,125,27,.35);
  transition:transform .08s, filter .15s;
}
.bj-btn:active:not(:disabled){ transform:translateY(2px); filter:brightness(.97); }
.bj-btn:disabled{ opacity:.45; cursor:not-allowed; }
.bj-btn.wide{ flex:2; }
.bj-btn.hit    { background:linear-gradient(160deg,#34d27b,#13a85a); box-shadow:0 5px 14px rgba(19,168,90,.35); }
.bj-btn.stand  { background:linear-gradient(160deg,#f0b15a,#d18a2c); box-shadow:0 5px 14px rgba(209,138,44,.35); }
.bj-btn.double { background:linear-gradient(160deg,#a779e0,#7e46c9); box-shadow:0 5px 14px rgba(126,70,201,.35); }
.bj-btn.ghost  { background:#fff; color:#a96e35; border:1.5px solid #d9ad82; box-shadow:none; }

.bj-hint { font-size:10.5px; color:#9aa0ad; text-align:center; letter-spacing:.02em; }
.bj-hint .err { color:#d23b34; }

@media (max-width:430px){
  .bj-card,.bj-back{ width:62px; height:88px; }
  .bj-card .mid{ font-size:28px; }
  .bj-chip{ width:46px; height:46px; }
  .bj-table{ min-height:260px; }
  .bj-crest{ font-size:140px; }
  .bj-ins-arc{ height:104px; }
}

@media (max-width:480px){
  .bj-wrap{
    max-width:100%;
    border-left:none;
    border-right:none;
  }
}
  
@media (prefers-reduced-motion:reduce){
  .bj-card-anim,.bj-flip,.bj-chip,.bj-btn{ animation:none !important; transition:none !important; }
}
`;

/* Presentational */
function Card({ card, flip = false }) {
  const red = card.suit === '\u2665' || card.suit === '\u2666';
  return (
    <div className={`bj-card ${flip ? 'bj-flip' : 'bj-card-anim'}`} style={{ color: red ? '#b8392b' : '#16110a' }}>
      <span className="c">{card.rank}<span className="s">{card.suit}</span></span>
      <span className="mid">{card.suit}</span>
      <span className="c br">{card.rank}<span className="s">{card.suit}</span></span>
    </div>
  );
}

const CardBack = () => <div className="bj-back bj-card-anim" />;

function Chip({ value, onClick, disabled }) {
  const gold = value === 10000;
  return (
    <button
      type="button"
      className="bj-chip"
      disabled={disabled}
      onClick={onClick}
      style={{ background: CHIP_COLORS[value], color: gold ? '#3a2410' : '#fff' }}
    >
      {chipLabel(value)}
    </button>
  );
}

function resultText(game) {
  const { result, playerScore, dealerScore, dealerHand, bet, payout } = game;
  let title, kind;

  if (result === 'blackjack') {
    title = 'Blackjack!';
    kind = 'win';
  } else if (result === 'win') {
    title = dealerScore > 21 ? 'Banker busts' : 'You win';
    kind = 'win';
  } else if (result === 'push') {
    title = 'Push';
    kind = 'push';
  } else {
    kind = 'lose';
    if (playerScore > 21) title = 'Bust';
    else if (dealerHand?.length === 2 && dealerScore === 21) title = 'Banker blackjack';
    else title = 'Banker wins';
  }

  const sub = kind === 'push' ? 'Bet returned'
    : kind === 'win' ? '+' + fmt(payout - bet)
      : '-' + fmt(bet);

  return { title, kind, sub };
}

/* Main Component */
export default function Blackjack() {

  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [game, setGame] = useState(null);
  const [bet, setBet] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [bettingDisabled, setBettingDisabled] = useState(false);
  const [bettingMsg, setBettingMsg] = useState('');

  const balanceRef = useRef(0);

  const setBalanceTracked = (n) => {
    balanceRef.current = n;
    setBalance(n);
  };

  const flashByDelta = (next) => {
    const prev = balanceRef.current;
    if (next > prev) { setFlash('up'); setTimeout(() => setFlash(''), 700); }
    else if (next < prev) { setFlash('down'); setTimeout(() => setFlash(''), 700); }
  };

  const api = useMemo(() => ({
    active: () => axiosInstance.get('/blackjack/active'),
    start: (bet) => axiosInstance.post('/blackjack/start', { bet }),
    hit: () => axiosInstance.post('/blackjack/hit'),
    stand: () => axiosInstance.post('/blackjack/stand'),
    double: () => axiosInstance.post('/blackjack/double'),
  }), []);

  useEffect(() => {
    api.active()
      .then(({ data }) => {
        setBalanceTracked(data.balance);
        if (data.game) setGame(data.game);
      })
      .catch((err) => setError(err.response?.data?.error || err.message));
  }, [api]);

  const act = useCallback(async (fn) => {
    setBusy(true); setError('');
    try {
      const { data } = await fn();
      if (typeof data.balance === 'number') {
        flashByDelta(data.balance);
        setBalanceTracked(data.balance);
      }
      setGame(data.game);
    } catch (err) {
      if (err.response?.status === 403) {
        setBettingMsg(err.response.data?.message || 'Betting has been disabled for your account.');
        setBettingDisabled(true);
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || err.message);
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const addChip = (v) => {
    if (bet + v > balance) return setError('Not enough balance for that chip.');
    setError('');
    setBet(bet + v);
  };

  const deal = () => bet > 0 && act(() => api.start(bet));
  const hit = () => act(() => api.hit());
  const stand = () => act(() => api.stand());
  const double = () => act(() => api.double());
  const newHand = () => { setGame(null); setBet(0); setError(''); };

  const inPlay = game && game.status !== 'finished';
  const showResult = game && game.status === 'finished';
  const showBetting = !game;
  const canDouble = inPlay && game?.canDouble && balance >= game.bet;

  const banner = showResult ? resultText(game) : null;
  const dealerScoreClass = game && showResult && game.dealerScore > 21 ? 'bust' : '';
  const playerScoreClass = game
    ? (game.playerScore > 21 ? 'bust' : game.result === 'blackjack' ? 'bj' : '')
    : '';

  return (
    <>
      <div className="bj">
        <style>{CSS}</style>
        <div className="bj-wrap">
          <div className="bj-top">
            <div className="bj-top-l">
              <button className="bj-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
                <ArrowBackIosIcon sx={{ fontSize: 15 }} />
              </button>
            </div>
            <div className="bj-top-c">
              <span className="bj-name">Blackjack</span>
            </div>
            <div className="bj-top-r">
              <div className="bj-bal">
                <span className={`bj-bal-v ${flash}`}>{fmt(balance)}</span>
              </div>
            </div>
          </div>

          <div className="bj-body">
            <div className="bj-table">
              {/* felt print */}
              <div className="bj-felt-deco" aria-hidden="true">
                <span className="bj-crest">♠</span>
                <span className="bj-ins-arc" />
                <span className="bj-ins-text">Insurance pays 2 to 1</span>
              </div>

              <div className="bj-arc">
                <div className="bj-arc1">BLACKJACK PAYS 3 TO 2</div>
                <div className="bj-arc2">Dealer must stand on all 17s</div>
                <div className="bj-rule" />
              </div>

              {/* Dealer */}
              <div className="bj-seat dealer">
                <div className="bj-head">
                  <span className="bj-who">Banker</span>
                  {game && <span className={`bj-score ${dealerScoreClass}`}>{game.dealerScore}</span>}
                </div>
                <div className="bj-cards">
                  {game?.dealerHand?.map((c, i) =>
                    c.hidden ? (
                      <CardBack key={`d-${i}`} />
                    ) : (
                      <Card key={`d-${i}`} card={c} flip={showResult} />
                    )
                  )}
                </div>
              </div>

              {/* Banner */}
              <div className="bj-banner">
                {banner && (
                  <>
                    <div className={`bj-msg ${banner.kind}`}>{banner.title}</div>
                    <div className="bj-delta">{banner.sub}</div>
                  </>
                )}
              </div>

              {/* Player */}
              <div className="bj-seat player">
                <div className="bj-head">
                  <span className="bj-who">You</span>
                  {game && <span className={`bj-score ${playerScoreClass}`}>{game.playerScore}</span>}
                </div>
                <div className="bj-cards">
                  {game?.playerHand?.map((c, i) => (
                    <Card key={`p-${i}`} card={c} />
                  ))}
                </div>
              </div>
            </div>

            <div className="bj-ctrl">
              {showBetting && (
                <div className="bj-betrow">
                  <div className="bj-chips">
                    {CHIPS.map(v => (
                      <Chip
                        key={v}
                        value={v}
                        disabled={busy || bet + v > balance}
                        onClick={() => addChip(v)}
                      />
                    ))}
                  </div>
                  <div className="bj-betbox">
                    <div className="l">Bet</div>
                    <div className="v">{fmt(bet)}</div>
                  </div>
                </div>
              )}

              <div className="bj-actions">
                {showBetting && (
                  <>
                    <button className="bj-btn ghost" disabled={busy || bet === 0} onClick={() => setBet(0)}>Clear</button>
                    <button className="bj-btn wide" disabled={busy || bet === 0} onClick={deal}>Deal</button>
                  </>
                )}

                {inPlay && (
                  <>
                    <button className="bj-btn hit" disabled={busy} onClick={hit}>Hit</button>
                    <button className="bj-btn stand" disabled={busy} onClick={stand}>Stand</button>
                    <button className="bj-btn double" disabled={busy || !canDouble} onClick={double}>Double</button>
                  </>
                )}

                {showResult && (
                  <button className="bj-btn wide" disabled={busy} onClick={newHand}>New hand</button>
                )}
              </div>

              <div className="bj-hint">
                {error ? <span className="err">{error}</span>
                  : showBetting ? 'Tap chips to set your bet, then deal.'
                    : inPlay ? 'Hit, stand, or double down.'
                      : 'Deal again when you are ready.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Betting disabled modal */}
      {bettingDisabled && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: 'rgba(0,0,0,0.65)' }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', textAlign: 'center', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', background: 'linear-gradient(160deg,#ff9f43,#ee7d1b)', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" fill="none" width="30" height="30" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M4.93 4.93l14.14 14.14" />
                </svg>
              </div>
            </div>
            <div style={{ padding: '24px 24px 28px' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#20242e', margin: '0 0 8px' }}>Betting Disabled</h3>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px', lineHeight: 1.6 }}>{bettingMsg}</p>
              <button
                onClick={() => navigate(-1)}
                style={{ width: '100%', padding: '13px', border: 'none', borderRadius: 12, background: 'linear-gradient(160deg,#ff9f43,#ee7d1b)', color: '#fff', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}