import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { WorldMap } from './components/WorldMap';

// Map 2-letter ISO country codes to map region keys
const REGION_MAPPING: Record<string, string> = {
  TW: 'east_asia',
  CN: 'east_asia',
  JP: 'east_asia',
  KR: 'east_asia',
  US: 'na_east',
  CA: 'na_west', // Map Canada to na_west for visual balance
  BR: 'sa',
  AR: 'sa',
  CL: 'sa',
  GB: 'europe',
  FR: 'europe',
  DE: 'europe',
  IT: 'europe',
  ES: 'europe',
  NL: 'europe',
  IN: 'south_asia',
  VN: 'south_asia',
  TH: 'south_asia',
  AU: 'oceania',
  NZ: 'oceania',
  ZA: 'africa',
  EG: 'africa'
};

function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<any>(null);
  const [onlineCounter, setOnlineCounter] = useState(31482);

  // Heatmap Region Counts (lat/lng-positioned; loaded from DB)
  const [heatmapStats, setHeatmapStats] = useState<any>({
    na_west:    { name: '北美西部',  count: 0 },
    na_east:    { name: '北美東部',  count: 0 },
    sa:         { name: '南美洲',    count: 0 },
    europe:     { name: '歐洲地區',  count: 0 },
    africa:     { name: '非洲地區',  count: 0 },
    east_asia:  { name: '東亞地區',  count: 0 },
    south_asia: { name: '南亞地區',  count: 0 },
    oceania:    { name: '大洋洲',    count: 0 },
  });

  const fetchSummary = useCallback(async () => {
    try {
      const res = await axios.get('/api/v1/countrySummary');
      const summaryList = res.data; // List of { countryCode: string, submissionCount: number }
      
      setHeatmapStats((prevStats: any) => {
        const newStats = { ...prevStats };
        // Reset counts first
        for (const k in newStats) {
          newStats[k] = { ...newStats[k], count: 0 };
        }
        // Map and aggregate counts
        summaryList.forEach((item: any) => {
          const region = REGION_MAPPING[item.countryCode];
          if (region && newStats[region]) {
            newStats[region].count += item.submissionCount;
          }
        });
        return newStats;
      });
    } catch (err) {
      console.error('Failed to fetch country summary', err);
    }
  }, []);

  // Fetch summary on load
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Simulate real-time active users fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCounter((prev) => prev + Math.floor(Math.random() * 7) - 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simulate random global activity surges on map (temporarily adding values to state)
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


  const handleNewSubmission = (human: any) => {
    setLastSubmission(human);
    setUnlocked(true);
    setOnlineCounter((prev) => prev + 1);
    
    // Re-fetch counts from database to reflect the new submission
    fetchSummary();
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
