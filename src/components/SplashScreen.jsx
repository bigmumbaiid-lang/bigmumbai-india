import splashImage from '../assets/splashImage.png';
import bigMumbaiLogo from '../assets/bigMumbaiLogo.png';

const BRAND_GRADIENT = 'linear-gradient(90deg, rgb(217,173,130), rgb(177,131,90))';

const SHELL = 'fixed inset-0 flex items-center justify-center w-full lg:max-w-[400px] mx-auto';
const INNER = 'w-full h-full flex flex-col items-center overflow-hidden px-6';

export default function SplashScreen({ tagline = 'Withdraw fast, safe and stable' }) {
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
                <div className="flex flex-col items-center gap-3 mt-4 animate-splashIn">
                    {/* Card icon — much bigger, near full width */}
                    <img
                        src={splashImage}
                        alt=""
                        className="w-72 sm:w-96 h-auto animate-splashFloat"
                        style={{ filter: 'drop-shadow(0 18px 28px rgba(177,131,90,0.28))' }}
                    />
                    <p
                        className="text-xl sm:text-2xl font-bold tracking-wide bg-clip-text text-transparent text-center"
                        style={{ backgroundImage: BRAND_GRADIENT }}
                    >
                        {tagline}
                    </p>
                </div>

                <img
                    src={bigMumbaiLogo}
                    alt="Big Mumbai"
                    className="w-52  h-auto mx-auto mt-28"
                />
            </div>
        </div>
    );
}