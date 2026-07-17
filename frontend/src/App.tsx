import { useState, useEffect } from 'react';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { WorldMap } from './components/WorldMap';

function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<any>(null);
  const [onlineCounter, setOnlineCounter] = useState(31482);

  // Heatmap Region Base Counts (lat/lng-positioned; D3 projection handles rendering)
  const [heatmapStats, setHeatmapStats] = useState<any>({
    na_west:    { name: '北美西部',  count: 8520 },
    na_east:    { name: '北美東部',  count: 18420 },
    sa:         { name: '南美洲',    count: 5210 },
    europe:     { name: '歐洲地區',  count: 24850 },
    africa:     { name: '非洲地區',  count: 1840 },
    east_asia:  { name: '東亞地區',  count: 32510 },
    south_asia: { name: '南亞地區',  count: 14120 },
    oceania:    { name: '大洋洲',    count: 1240 },
  });

  // Simulate real-time active users fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCounter((prev) => prev + Math.floor(Math.random() * 7) - 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simulate random global activity surges
  useEffect(() => {
    const interval = setInterval(() => {
      setHeatmapStats((prevStats: any) => {
        const newStats = { ...prevStats };
        const keys = Object.keys(newStats);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        newStats[randomKey] = {
          ...newStats[randomKey],
          count: newStats[randomKey].count + Math.floor(Math.random() * 12) + 1,
        };
        return newStats;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const detectRegionKey = (locationStr: string): string => {
    const loc = (locationStr || '').toLowerCase();
    if (loc.includes('台') || loc.includes('台北') || loc.includes('高雄') || loc.includes('中') || loc.includes('東亞') || loc.includes('japan') || loc.includes('東京') || loc.includes('seoul') || loc.includes('asia') || loc.includes('亞')) return 'east_asia';
    if (loc.includes('溫哥華') || loc.includes('vancouver') || loc.includes('西雅圖') || loc.includes('加州') || loc.includes('west')) return 'na_west';
    if (loc.includes('us') || loc.includes('usa') || loc.includes('美') || loc.includes('紐約') || loc.includes('加拿大')) return 'na_east';
    if (loc.includes('歐') || loc.includes('巴') || loc.includes('倫') || loc.includes('英') || loc.includes('德') || loc.includes('意') || loc.includes('西') || loc.includes('europe')) return 'europe';
    if (loc.includes('南美') || loc.includes('巴西') || loc.includes('智利') || loc.includes('阿根廷') || loc.includes('brazil')) return 'sa';
    if (loc.includes('印度') || loc.includes('南亞') || loc.includes('india') || loc.includes('泰') || loc.includes('越')) return 'south_asia';
    if (loc.includes('澳') || loc.includes('紐西蘭') || loc.includes('澳洲') || loc.includes('oceania') || loc.includes('大洋')) return 'oceania';
    if (loc.includes('非') || loc.includes('南非') || loc.includes('埃及') || loc.includes('africa')) return 'africa';
    const defaultPool = ['east_asia', 'na_east', 'europe'];
    return defaultPool[Math.floor(Math.random() * defaultPool.length)];
  };

  const handleNewSubmission = (human: any) => {
    setLastSubmission(human);
    setUnlocked(true);
    setOnlineCounter((prev) => prev + 1);

    const region = detectRegionKey(human.country);
    setHeatmapStats((prev: any) => {
      const update = { ...prev };
      if (update[region]) {
        update[region] = {
          ...update[region],
          count: update[region].count + Math.floor(Math.random() * 150) + 200,
        };
      }
      return update;
    });
  };

  return (
    <div className="text-slate-100 min-h-screen relative font-sans flex flex-col justify-between bg-[#030712] overflow-hidden">

      {/* ── D3 World Map Background ── */}
      <WorldMap heatmapStats={heatmapStats} />

      {/* Soft top/bottom gradient fade over the map */}
      <div className="absolute inset-0 z-[1] pointer-events-none select-none bg-gradient-to-b from-[#030712]/60 via-transparent to-[#030712]/70" />

      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center z-30 relative">
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
      <main className="w-full flex-1 flex flex-col lg:flex-row items-stretch justify-start px-4 md:px-8 lg:px-12 py-4 gap-8 z-20 relative overflow-hidden pointer-events-none">
        <LeftPanel onNewSubmission={handleNewSubmission} />
        <RightPanel unlocked={unlocked} lastSubmission={lastSubmission} />
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-3 border-t border-slate-900/55 flex flex-col md:flex-row justify-between items-center text-[11px] text-slate-500 z-30 relative bg-slate-950/80 backdrop-blur-md">
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
