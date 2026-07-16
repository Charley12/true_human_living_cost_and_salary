import { useState, useEffect } from 'react';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { clsx } from 'clsx';

function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<any>(null);
  const [onlineCounter, setOnlineCounter] = useState(31482);

  // Heatmap Region Base Counts (moved from RightPanel)
  const [heatmapStats, setHeatmapStats] = useState<any>({
    na_west: { name: "北美西部", count: 8520, x: 18, y: 28 },
    na_east: { name: "北美東部", count: 18420, x: 28, y: 32 },
    sa: { name: "南美洲", count: 5210, x: 36, y: 65 },
    europe: { name: "歐洲地區", count: 24850, x: 50, y: 26 },
    africa: { name: "非洲地區", count: 1840, x: 54, y: 54 },
    east_asia: { name: "東亞地區", count: 32510, x: 79, y: 34 },
    south_asia: { name: "南亞地區", count: 14120, x: 71, y: 46 },
    oceania: { name: "大洋洲", count: 1240, x: 86, y: 76 }
  });

  useEffect(() => {
    // Simulate real-time active users fluctuation
    const interval = setInterval(() => {
      setOnlineCounter((prev) => prev + Math.floor(Math.random() * 7) - 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update heatmap based on simulated surge
  useEffect(() => {
    const interval = setInterval(() => {
      setHeatmapStats((prevStats: any) => {
        const newStats = { ...prevStats };
        const keys = Object.keys(newStats);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        newStats[randomKey].count += Math.floor(Math.random() * 12) + 1;
        return newStats;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const detectRegionKey = (locationStr: string): string => {
    const loc = (locationStr || "").toLowerCase();
    if (loc.includes("台") || loc.includes("台北") || loc.includes("高雄") || loc.includes("中") || loc.includes("東亞") || loc.includes("japan") || loc.includes("東京") || loc.includes("seoul") || loc.includes("asia") || loc.includes("亞")) {
      return "east_asia";
    }
    if (loc.includes("溫哥華") || loc.includes("vancouver") || loc.includes("西雅圖") || loc.includes("加州") || loc.includes("west")) {
      return "na_west";
    }
    if (loc.includes("us") || loc.includes("usa") || loc.includes("美") || loc.includes("紐約") || loc.includes("加拿大")) {
      return "na_east";
    }
    if (loc.includes("歐") || loc.includes("巴") || loc.includes("倫") || loc.includes("英") || loc.includes("德") || loc.includes("意") || loc.includes("西") || loc.includes("europe")) {
      return "europe";
    }
    if (loc.includes("南美") || loc.includes("巴西") || loc.includes("智利") || loc.includes("阿根廷") || loc.includes("brazil")) {
      return "sa";
    }
    if (loc.includes("印度") || loc.includes("南亞") || loc.includes("india") || loc.includes("泰") || loc.includes("越")) {
      return "south_asia";
    }
    if (loc.includes("澳") || loc.includes("紐西蘭") || loc.includes("澳洲") || loc.includes("oceania") || loc.includes("大洋")) {
      return "oceania";
    }
    if (loc.includes("非") || loc.includes("南非") || loc.includes("埃及") || loc.includes("africa")) {
      return "africa";
    }
    const defaultPool = ["east_asia", "na_east", "europe"];
    return defaultPool[Math.floor(Math.random() * defaultPool.length)];
  };

  const handleNewSubmission = (human: any) => {
    setLastSubmission(human);
    setUnlocked(true);
    setOnlineCounter((prev) => prev + 1);

    // Update heatmap count based on new submission
    const region = detectRegionKey(human.country);
    setHeatmapStats((prev: any) => {
      const update = { ...prev };
      if (update[region]) {
        update[region].count += Math.floor(Math.random() * 150) + 200;
      }
      return update;
    });
  };

  return (
    <div className="text-slate-100 min-h-screen relative font-sans flex flex-col justify-between bg-[#030712] overflow-hidden">
      {/* Background Grid & SVG World Map (Global Chart) */}
      <div className="absolute inset-0 z-0 opacity-35 flex items-center justify-center pointer-events-none select-none">
        <div className="relative w-full h-full flex items-center justify-center">
          <svg className="w-[95%] h-[95%] transition-colors duration-500" fill="none" viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="tactical-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(71, 85, 105, 0.15)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="1000" height="600" fill="url(#tactical-grid)" />
            
            {/* Outlines of continents */}
            <path d="M 290 60 L 340 50 L 360 80 L 320 100 L 280 85 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1.5" />
            <path d="M 120 120 L 140 100 L 190 90 L 250 80 L 290 85 L 340 100 L 320 130 L 350 150 L 310 180 L 280 185 L 290 220 L 250 250 L 240 280 L 210 320 L 200 350 L 190 350 L 205 290 L 175 250 L 195 210 L 155 190 L 135 200 L 115 170 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1.5" />
            <path d="M 315 270 L 345 285 L 375 320 L 415 365 L 430 400 L 410 450 L 380 500 L 360 540 L 350 540 L 355 480 L 335 430 L 315 380 L 295 330 L 305 295 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1.5" />
            <path d="M 460 140 L 485 130 L 515 125 L 540 135 L 560 150 L 550 180 L 525 210 L 485 220 L 465 200 L 450 180 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1.5" />
            <path d="M 470 230 L 525 220 L 550 235 L 585 240 L 610 265 L 615 300 L 590 350 L 565 410 L 555 460 L 540 460 L 535 410 L 510 360 L 480 320 L 465 280 L 460 250 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1.5" />
            <path d="M 590 410 L 605 400 L 615 425 L 600 445 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1.5" />
            <path d="M 545 135 L 590 120 L 650 110 L 710 105 L 790 115 L 850 130 L 880 155 L 860 185 L 820 220 L 840 250 L 800 290 L 760 310 L 745 280 L 715 260 L 685 280 L 665 260 L 640 270 L 620 250 L 585 245 L 560 215 L 565 175 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1.5" />
            <path d="M 720 310 L 755 315 L 740 335 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1.5" />
            <path d="M 765 320 L 795 310 L 815 335 L 785 355 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1.5" />
            <path d="M 805 440 L 850 420 L 885 435 L 890 470 L 860 500 L 810 490 L 795 465 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1.5" />
            <path d="M 900 515 L 915 510 L 905 540 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1.5" />
            <path d="M 150 570 L 850 570 L 800 590 L 200 590 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1.5" />
          </svg>

          {/* Interactive Heatmap Nodes */}
          <div className="absolute inset-0 pointer-events-auto">
            {Object.keys(heatmapStats).map((key) => {
              const region = heatmapStats[key];
              const count = region.count;
              const intensity = Math.min(count / 30000, 1.0);

              const size = 12 + intensity * 26; // diameter 12px ~ 38px
              const glowSize = 30 + intensity * 60; // outer glow 30px ~ 90px

              const isCritical = count >= 15000;
              const isMedium = count >= 2000 && count < 15000;

              return (
                <div
                  key={key}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group transition-all duration-700 pointer-events-auto cursor-help"
                  style={{ left: `${region.x}%`, top: `${region.y}%` }}
                >
                  {/* Outer Ripple */}
                  <div
                    className={clsx(
                      "absolute inset-0 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-700",
                      isCritical ? "bg-rose-600/30 animate-ping" : isMedium ? "bg-rose-800/30" : "bg-rose-950/10"
                    )}
                    style={{ width: `${glowSize}px`, height: `${glowSize}px`, filter: "blur(8px)" }}
                  />

                  {/* Core heat dot */}
                  <div
                    className={clsx(
                      "relative rounded-full border flex items-center justify-center font-mono font-black text-[9px] select-none transition-all duration-500",
                      isCritical ? "bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-500/80" : isMedium ? "bg-rose-800/60 border-rose-700/80 text-rose-300" : "bg-rose-950/40 border-rose-900/60 text-slate-500"
                    )}
                    style={{ width: `${size}px`, height: `${size}px` }}
                  >
                    {isCritical ? "!" : ""}
                  </div>

                  {/* Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-950/95 border border-slate-800/90 text-[10px] text-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xl opacity-0 scale-95 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 z-50 whitespace-nowrap">
                    <p className="font-extrabold text-rose-500">{region.name}</p>
                    <p className="text-slate-400 mt-0.5 font-semibold">
                      真實吶喊數: <span className="text-white font-mono font-bold">{count.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center z-30 relative bg-gradient-to-b from-slate-950/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-900/50">
            <i className="fa-solid fa-fingerprint text-xl text-white animate-pulse-slow"></i>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wider text-rose-500">TrueHuman</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Global Resistance Ledger</p>
          </div>
        </div>
        <div className="flex gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>{onlineCounter.toLocaleString()}</span> Humans Online
          </span>
        </div>
      </header>

      {/* Main Body */}
      <main className="w-full flex-1 flex flex-col lg:flex-row items-stretch justify-start px-4 md:px-8 lg:px-12 py-4 gap-8 z-20 relative overflow-hidden">
        <LeftPanel onNewSubmission={handleNewSubmission} />
        <RightPanel unlocked={unlocked} lastSubmission={lastSubmission} />
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-3 border-t border-slate-900/55 flex flex-col md:flex-row justify-between items-center text-[11px] text-slate-500 z-30 relative bg-slate-950/90 backdrop-blur-md">
        <div>
          © 2026 <span className="text-rose-500/80 font-bold">TrueHuman Project.</span> All Cries Are Anonymous.
        </div>
        <div className="flex gap-6 mt-2 md:mt-0">
          <a href="#" className="hover:text-rose-400 transition">去中心化通訊協定</a>
          <a href="#" className="hover:text-rose-400 transition">API 開源儲存庫</a>
          <a href="#" className="hover:text-rose-400 transition">生存痛苦指數算法</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
