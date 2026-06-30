export default function App() {
  return (
    <div className="min-h-screen max-h-screen bg-gray-100 flex items-center justify-center p-4">

      {/* 400px Centered Mobile Container */}
      <div className="w-full max-w-[400px] h-screen bg-[#40E0D0] flex flex-col overflow-hidden shadow-2xl border border-gray-300">

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">














        </div>

        {/* Bottom Navigation */}
        <nav className="bg-[#000080] h-16 flex items-center justify-around text-white border-t border-cyan-900">
          <NavItem icon="🏠" label="Home" active />
          <NavItem icon="🔍" label="Search" />
          <NavItem icon="❤️" label="Favorites" />
          <NavItem icon="👤" label="Profile" />
        </nav>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false }) {
  return (
    <div className={`flex flex-col items-center justify-center flex-1 ${active ? 'text-white' : 'text-cyan-300'}`}>
      <span className="text-3xl mb-1">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  );
}