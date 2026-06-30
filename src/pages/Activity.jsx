import React from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import PromotionCard from '../components/PromotionCard'
import WinningSection from '../components/WinningSection'

function Activity() {
    const navigate = useNavigate()

    return (
        <div
            className="flex items-center justify-center bg-gray-50 min-h-screen"
            style={{ minHeight: '100dvh' }}
        >
            {/* h-screen is the fallback; 100dvh (inline) wins on iOS and tracks
                the Safari toolbar so the bottom nav stays in the visible area. */}
            <div
                className="relative w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-300"
                style={{ height: '100dvh' }}
            >
                {/* Header is its own flex row -> always pinned to the top, no sticky needed */}
                <div
                    className="flex-shrink-0 p-4 text-white flex items-center justify-center z-10"
                    style={{ background: 'linear-gradient(90deg,#d9ad82,#b1835a)' }}
                >
                    <span className="text-sm ml-1 font-medium">Activity</span>
                </div>

                {/* Scrollable middle. min-h-0 is required for flex children to scroll on iOS */}
                <div
                    className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    <PromotionCard />
                    <WinningSection />
                </div>

                {/* Bottom nav is the last flex row -> always at the bottom */}
                <BottomNav
                    activeTab="activity"
                    onTabChange={(tab) => navigate(`/${tab}`)}
                />
            </div>
        </div>
    )
}

export default Activity