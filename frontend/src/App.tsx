import { useState, useEffect } from 'react';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';

function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<any>(null);
  const [onlineCounter, setOnlineCounter] = useState(31482);

  useEffect(() => {
    // Simulate real-time active users fluctuation
    const interval = setInterval(() => {
      setOnlineCounter((prev) => prev + Math.floor(Math.random() * 7) - 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleNewSubmission = (human: any) => {
    setLastSubmission(human);
    setUnlocked(true);
    setOnlineCounter((prev) => prev + 1);
  };

  return (
    <div className="text-slate-100 min-h-screen relative font-sans flex flex-col justify-between bg-[#030712] overflow-hidden">
      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center z-30 relative bg-gradient-to-b from-slate-950 to-transparent">
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
      <footer className="w-full px-6 py-3 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center text-[11px] text-slate-500 z-30 relative bg-slate-950">
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
