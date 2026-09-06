import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Radar, Sparkles, CheckSquare, LineChart, Mail, Send, Menu, X, Gauge, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Intelligence Hub', path: '/intelligence', icon: Radar },
  { label: 'Campaign Ideation', path: '/ideation', icon: Sparkles },
  { label: 'Brainstorm Studio', path: '/brainstorm', icon: Lightbulb },
  { label: 'Scoring Engine', path: '/scoring', icon: Gauge },
  { label: 'Validation', path: '/validation', icon: CheckSquare },
  { label: 'Simulation', path: '/simulation', icon: LineChart },
  { label: 'Message Builder', path: '/messages', icon: Mail },
  { label: 'Distribution', path: '/distribution', icon: Send },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-primary text-primary-foreground flex flex-col transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-6 py-7 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Hang_Seng_Bank_%28emblem%29.svg/250px-Hang_Seng_Bank_%28emblem%29.svg.png"
                alt="Hang Seng Bank"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h1 className="font-display text-lg leading-tight">Meridian</h1>
              <p className="text-[11px] text-white/60 tracking-wide uppercase">Market Intelligence for Growth</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all",
                  active
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-white/75 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-5 border-t border-white/10 text-[11px] text-white/50">
          Banking Market Intelligence Platform
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)}><Menu className="w-5 h-5" /></button>
          <span className="font-display">Meridian</span>
          <div className="w-5" />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}