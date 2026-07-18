import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { WorldMap } from './components/WorldMap';
import { useTranslation } from './i18n/I18nContext';
import type { Language } from './i18n/I18nContext';
import { clsx } from 'clsx';

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
  const { t, locale, setLocale } = useTranslation();
  const [unlocked, setUnlocked] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<any>(null);
  const [onlineCounter, setOnlineCounter] = useState(31482);
  const [introStep, setIntroStep] = useState<'centered' | 'moving' | 'done'>('centered');

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

  // Logo intro animation sequence
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setIntroStep('moving');
    }, 1800);
    const timer2 = setTimeout(() => {
      setIntroStep('done');
    }, 3000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
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

      {/* Animating Logo Element */}
      <div
        className={clsx(
          "transition-all duration-[1200ms] ease-in-out flex flex-col items-center justify-center select-none",
          introStep === 'centered'
            ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-52 h-52 md:w-64 md:h-64"
            : "fixed top-4 left-6 w-14 h-14 z-30"
        )}
      >
        <div
          className={clsx(
            "w-full h-full rounded-2xl bg-[#030712] border-2 border-rose-600 shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-[1200ms]",
            introStep === 'centered' ? "shadow-rose-900/40 p-4" : "shadow-rose-950/50 p-1"
          )}
        >
          <img
            src="/logo.png"
            alt="TrueHuman Logo"
            className="w-full h-full object-contain invert"
          />
        </div>
        {/* Intro subtitle */}
        <div
          className={clsx(
            "mt-3 text-center transition-all duration-[800ms]",
            introStep === 'centered' ? "opacity-100 scale-100" : "opacity-0 scale-50 pointer-events-none h-0 overflow-hidden"
          )}
        >
          <h2 className="text-rose-500 font-extrabold text-lg tracking-widest uppercase">TrueHuman</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Worldwide is suffered</p>
        </div>
      </div>

      {/* Rest of the Dashboard Container (Fades in) */}
      <div
        className={clsx(
          "flex-1 flex flex-col justify-between transition-opacity duration-1000 z-10",
          introStep === 'centered' ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        {/* Header */}
        <header className="w-full px-6 py-4 flex justify-between items-center z-30 relative bg-slate-950/20 backdrop-blur-sm border-b border-slate-900/30">
          <div className="flex items-center gap-3">
            {/* Logo spacer slot */}
            <div className="w-14 h-14 shrink-0" />
            <div>
              <h1 className="text-xl font-extrabold tracking-wider text-rose-500">{t('header.title')}</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t('header.subtitle')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-slate-400">
            {/* Language Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1.5 pointer-events-auto">
              <i className="fa-solid fa-globe text-rose-500"></i>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Language)}
                className="bg-transparent text-slate-200 outline-none cursor-pointer text-xs font-semibold"
              >
                <option value="en-US" className="bg-slate-950 text-slate-200">🇺🇸 English (US)</option>
                <option value="en-GB" className="bg-slate-950 text-slate-200">🇬🇧 English (UK)</option>
                <option value="de" className="bg-slate-950 text-slate-200">🇩🇪 Deutsch</option>
                <option value="fr" className="bg-slate-950 text-slate-200">🇫🇷 Français</option>
                <option value="es" className="bg-slate-950 text-slate-200">🇪🇸 Español</option>
                <option value="it" className="bg-slate-950 text-slate-200">🇮🇹 Italiano</option>
                <option value="pl" className="bg-slate-950 text-slate-200">🇵🇱 Polski</option>
                <option value="ru" className="bg-slate-950 text-slate-200">🇷🇺 Русский</option>
                <option value="uk" className="bg-slate-950 text-slate-200">🇺🇦 Українська</option>
              </select>
            </div>

            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>{onlineCounter.toLocaleString()}</span> {t('header.online')}
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
            {t('footer.copyright')}
          </div>
          <div className="flex gap-6 mt-2 md:mt-0">
            <a href="#" className="hover:text-rose-400 transition">{t('footer.protocol')}</a>
            <a href="#" className="hover:text-rose-400 transition">{t('footer.repo')}</a>
            <a href="#" className="hover:text-rose-400 transition">{t('footer.algorithm')}</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
