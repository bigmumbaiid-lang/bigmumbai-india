import { useEffect, useRef, useState } from 'react';
import splashImage from '../assets/splashImage.png';
import bigMumbaiLogo from '../assets/bigMumbaiLogo.png';

const BRAND_GRADIENT = 'linear-gradient(90deg, rgb(217,173,130), rgb(177,131,90))';

const SHELL = 'fixed inset-0 flex items-center justify-center w-full lg:max-w-[400px] mx-auto';
const INNER = 'w-full h-full flex flex-col items-center overflow-hidden px-6';

// Once both images are decoded we reveal the whole splash at once, then fire
// onReady after this floor so a fast session check can't tear the splash down
// the instant it paints (which read as a blank flash). It is a MINIMUM, not a
// fixed duration: a slower auth keeps the splash up for as long as it actually
// takes to load.
const MIN_VISIBLE_MS = 900;

// Absolute safety net so a hung or broken image download can never trap the
// user on a blank splash forever — reveal and release regardless after this.
const REVEAL_FALLBACK_MS = 4000;

export default function SplashScreen({ tagline = 'Withdraw fast, safe and stable', onReady }) {
    // Card art + logo are separate network fetches that can finish well after
    // the (free, instant) text would paint. Hold text + art + logo behind
    // opacity until BOTH images have actually decoded, then reveal them together
    // in one go instead of the text sitting there alone first.
    const [cardLoaded, setCardLoaded] = useState(false);
    const [logoLoaded, setLogoLoaded] = useState(false);
    const revealed = cardLoaded && logoLoaded;

    const cardRef = useRef(null);
    const logoRef = useRef(null);

    // A cached image can finish loading before React attaches its onLoad handler,
    // so the event never fires and the splash would stay stuck behind opacity-0
    // (and never signal ready). Check .complete on mount to cover that, and keep
    // a hard fallback so even a truly hung request still releases the splash.
    useEffect(() => {
        if (cardRef.current?.complete) setCardLoaded(true);
        if (logoRef.current?.complete) setLogoLoaded(true);

        const fallback = setTimeout(() => {
            setCardLoaded(true);
            setLogoLoaded(true);
        }, REVEAL_FALLBACK_MS);
        return () => clearTimeout(fallback);
    }, []);

    // Tell the app it may dismiss the splash — but only after the branded content
    // has actually been on screen for a moment, never the instant it reveals. The
    // app still holds the splash up longer than this whenever auth is slower.
    useEffect(() => {
        if (!revealed) return;
        const t = setTimeout(() => onReady?.(), MIN_VISIBLE_MS);
        return () => clearTimeout(t);
    }, [revealed, onReady]);

    return (
        <div
            className={SHELL}
            style={{
                background: 'linear-gradient(180deg, #eceffa 0%, #f5f6fc 45%, #f9f9fd 100%)',
            }}
        >
            <div
                className={INNER}
                style={{
                    paddingTop: 'calc(7.25rem + env(safe-area-inset-top))',
                    paddingBottom: 'calc(8.5rem + env(safe-area-inset-bottom))',
                }}
            >
                <div
                    className={`flex flex-col items-center gap-3 mt-4 ${revealed ? 'animate-splashIn' : 'opacity-0'}`}
                >
                    {/* Card icon — much bigger, near full width */}
                    <img
                        ref={cardRef}
                        src={splashImage}
                        alt=""
                        className="w-72 sm:w-96 h-auto animate-splashFloat"
                        style={{ filter: 'drop-shadow(0 18px 28px rgba(177,131,90,0.28))' }}
                        onLoad={() => setCardLoaded(true)}
                        onError={() => setCardLoaded(true)}
                    />
                    <p
                        className="text-xl sm:text-2xl font-bold tracking-wide bg-clip-text text-transparent text-center"
                        style={{ backgroundImage: BRAND_GRADIENT }}
                    >
                        {tagline}
                    </p>
                </div>

                <img
                    ref={logoRef}
                    src={bigMumbaiLogo}
                    alt="Big Mumbai"
                    className="w-52 h-auto mx-auto mt-28 transition-opacity duration-300"
                    style={{ opacity: revealed ? 1 : 0 }}
                    onLoad={() => setLogoLoaded(true)}
                    onError={() => setLogoLoaded(true)}
                />
            </div>

            {/* While the splash art is still downloading, fill the otherwise-blank
                gradient with an on-brand spinner instead of nothing. It cross-fades
                out the instant the art is ready to reveal. */}
            <div
                role="status"
                aria-label="Loading"
                aria-hidden={revealed}
                className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
                style={{ opacity: revealed ? 0 : 1, pointerEvents: 'none' }}
            >
                <div className="relative flex items-center justify-center">
                    {/* soft brand glow that gently breathes behind the ring */}
                    <div
                        className="absolute w-24 h-24 rounded-full blur-2xl animate-pulse"
                        style={{ background: 'radial-gradient(circle, rgba(217,173,130,0.55), transparent 70%)' }}
                    />
                    {/* spinning gradient ring in the brand gold → bronze */}
                    <div
                        className="w-14 h-14 rounded-full animate-spin"
                        style={{
                            background: 'conic-gradient(from 0deg, rgba(177,131,90,0), rgba(217,173,130,0.9), rgb(177,131,90))',
                            WebkitMask: 'radial-gradient(farthest-side, #0000 calc(100% - 4px), #000 0)',
                            mask: 'radial-gradient(farthest-side, #0000 calc(100% - 4px), #000 0)',
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
