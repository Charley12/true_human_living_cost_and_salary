import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Lock, MapPin, Eye, Trophy, MessageSquare } from "lucide-react";
import { clsx } from "clsx";

interface RightPanelProps {
  unlocked: boolean;
  lastSubmission: any;
}

interface LeaderboardEntry {
  countryCode: string;
  submissionCount: number;
}

interface DeclarationEntry {
  id: string;
  name: string;
  country: string;
  message: string;
  createdAt: string;
}

interface FloatingCard {
  id: string;
  name: string;
  country: string;
  income: number;
  rent: number;
  mortgage: number;
  living: number;
  cry: string;
  photo: string | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotate: number;
  opacity: number;
  isHovered: boolean;
}

const DEFAULT_MOCK_HUMANS = [
  {
    id: "mock-1",
    name: "Takahiro",
    country: "東京, 日本",
    income: 2600,
    rent: 950,
    mortgage: 0,
    living: 800,
    cry: "年終降了，物價卻每天都在漲。在便利商店買晚餐都要看價格，我真的有在『活著』嗎？",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "mock-2",
    name: "Chloe",
    country: "巴黎, 法國",
    income: 2100,
    rent: 1100,
    mortgage: 0,
    living: 600,
    cry: "奧運後房租漲了25%。我跟另外三個人合租一個小公寓。資本把我們逼進角落，然後叫這做『自由市場』。",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "mock-3",
    name: "Marcus",
    country: "溫哥華, 加拿大",
    income: 4200,
    rent: 2500,
    mortgage: 0,
    living: 1200,
    cry: "我每週工作 55 小時。收入的一半以上要給那個甚至沒見過面的房東。我的青春只是在幫他付他的豪宅房貸。",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "mock-4",
    name: "小陳",
    country: "深圳, 中國",
    income: 1800,
    rent: 700,
    mortgage: 0,
    living: 600,
    cry: "35歲危機，大廠裁員，房貸壓得我整晚失眠。我們像燃料一樣被燃燒，燒完了就被體制無情倒掉。",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "mock-5",
    name: "Sarah",
    country: "倫敦, 英國",
    income: 3100,
    rent: 1650,
    mortgage: 0,
    living: 900,
    cry: "我是一名護士。我每天都在挽救生命，但我自己的生活卻在慢慢窒息。倫敦的房租已經瘋了。",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "mock-6",
    name: "Diego",
    country: "聖保羅, 巴西",
    income: 1200,
    rent: 550,
    mortgage: 0,
    living: 500,
    cry: "本地工作被跨國外包砍價，我們只能在極低的薪水裡內捲。連最基本的醫療我都負擔不起了。",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120"
  }
];

export function RightPanel({ unlocked, lastSubmission }: RightPanelProps) {
  // Tabs State
  const [activeTab, setActiveTab] = useState<"leaderboard" | "messageBoard">("leaderboard");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [messages, setMessages] = useState<DeclarationEntry[]>([]);
  const [declForm, setDeclForm] = useState({ name: "", country: "", message: "" });
  const [widgetOpen, setWidgetOpen] = useState(true);

  // Heatmap Region Base Counts (adds dynamic counts from leaderboard entries)
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

  // Floating Cards State
  const [floatingCards, setFloatingCards] = useState<FloatingCard[]>([]);
  const cardsRef = useRef<FloatingCard[]>([]);

  // Request animation frame handle
  const animationFrameId = useRef<number | null>(null);

  // 1. Fetch data from backend on mount and on unlock
  useEffect(() => {
    fetchLeaderboard();
    if (unlocked) {
      fetchMessages();
    }
  }, [unlocked]);

  // 2. Fetch Leaderboard
  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get<LeaderboardEntry[]>("/api/v1/leaderboard");
      setLeaderboard(res.data);
      updateHeatmapFromLeaderboard(res.data);
    } catch (e) {
      console.error("Failed to fetch leaderboard", e);
    }
  };

  // 3. Fetch Messages
  const fetchMessages = async () => {
    try {
      const res = await axios.get<DeclarationEntry[]>("/api/v1/declarations");
      setMessages(res.data);
    } catch (e) {
      console.error("Failed to fetch declarations", e);
    }
  };

  // 4. Update heatmap counts based on API response
  const updateHeatmapFromLeaderboard = (entries: LeaderboardEntry[]) => {
    setHeatmapStats((prevStats: any) => {
      const newStats = { ...prevStats };
      entries.forEach((entry) => {
        const code = entry.countryCode.toUpperCase();
        if (["TW", "JP", "CN", "KR"].includes(code)) {
          newStats.east_asia.count += entry.submissionCount;
        } else if (["US", "CA"].includes(code)) {
          newStats.na_east.count += entry.submissionCount;
        } else if (["FR", "GB", "DE", "IT", "ES"].includes(code)) {
          newStats.europe.count += entry.submissionCount;
        } else if (["BR", "AR", "CL"].includes(code)) {
          newStats.sa.count += entry.submissionCount;
        } else if (["IN", "TH", "VN"].includes(code)) {
          newStats.south_asia.count += entry.submissionCount;
        } else if (["AU", "NZ"].includes(code)) {
          newStats.oceania.count += entry.submissionCount;
        } else if (["ZA", "EG"].includes(code)) {
          newStats.africa.count += entry.submissionCount;
        }
      });
      return newStats;
    });
  };

  // 5. Detect region based on location string
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

  // Helper: Get random position in RightPanel area
  const getSpawnPosition = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Desktop: cards float primarily in the right 35% - 85% area.
    // Mobile: cards float across the screen
    const isDesktop = width > 1024;
    const minX = isDesktop ? width * 0.1 : width * 0.05;
    const maxX = isDesktop ? width * 0.55 : width * 0.85;
    const minY = height * 0.05;
    const maxY = height * 0.65;

    return {
      x: Math.random() * (maxX - minX) + minX,
      y: Math.random() * (maxY - minY) + minY
    };
  };

  // Helper: Create a raw card object
  const createFloatingCardObject = (human: any, id: string): FloatingCard => {
    const pos = getSpawnPosition();
    return {
      id,
      name: human.name,
      country: human.country,
      income: human.income,
      rent: human.rent,
      mortgage: human.mortgage,
      living: human.living,
      cry: human.cry,
      photo: human.photo,
      x: pos.x,
      y: pos.y,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      rotate: (Math.random() - 0.5) * 6,
      opacity: 0, // start transparent and fade in
      isHovered: false
    };
  };

  // 6. Initialize default mock cards
  useEffect(() => {
    const initialCards = DEFAULT_MOCK_HUMANS.map((h) => createFloatingCardObject(h, h.id));
    // Set opacity to 1 with staggered delays
    setFloatingCards(initialCards);
    cardsRef.current = initialCards;

    setTimeout(() => {
      setFloatingCards((prev) =>
        prev.map((c) => ({ ...c, opacity: 1 }))
      );
      cardsRef.current = cardsRef.current.map((c) => ({ ...c, opacity: 1 }));
    }, 100);

    // Animate region counts randomly every 3s
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

  // 7. Spawn new card when lastSubmission updates
  useEffect(() => {
    if (lastSubmission) {
      const newCardId = `sub-${Date.now()}`;
      const newCard = createFloatingCardObject(lastSubmission, newCardId);

      setFloatingCards((prev) => [...prev, newCard]);
      cardsRef.current = [...cardsRef.current, newCard];

      // Stagger fade-in
      setTimeout(() => {
        setFloatingCards((prev) =>
          prev.map((c) => (c.id === newCardId ? { ...c, opacity: 1 } : c))
        );
        cardsRef.current = cardsRef.current.map((c) =>
          c.id === newCardId ? { ...c, opacity: 1 } : c
        );
      }, 100);

      // Increment heatmap region count
      const region = detectRegionKey(lastSubmission.country);
      setHeatmapStats((prev: any) => {
        const update = { ...prev };
        if (update[region]) {
          update[region].count += Math.floor(Math.random() * 150) + 200;
        }
        return update;
      });

      // Refetch stats
      fetchLeaderboard();
      fetchMessages();
    }
  }, [lastSubmission]);

  // 8. Physics Engine Loop (Drifting cards)
  useEffect(() => {
    const updatePhysics = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isDesktop = width > 1024;

      const minX = isDesktop ? width * 0.02 : width * 0.02;
      const maxX = isDesktop ? width * 0.60 : width * 0.90;
      const minY = height * 0.05;
      const maxY = height * 0.70;

      const updated = cardsRef.current.map((card) => {
        if (card.isHovered) return card;

        let nextX = card.x + card.vx;
        let nextY = card.y + card.vy;
        let nextVx = card.vx;
        let nextVy = card.vy;

        // Bounce off walls
        if (nextX < minX || nextX > maxX) nextVx *= -1;
        if (nextY < minY || nextY > maxY) nextVy *= -1;

        // Keep inside bounds
        nextX = Math.max(minX, Math.min(maxX, nextX));
        nextY = Math.max(minY, Math.min(maxY, nextY));

        return {
          ...card,
          x: nextX,
          y: nextY,
          vx: nextVx,
          vy: nextVy
        };
      });

      cardsRef.current = updated;
      setFloatingCards(updated);

      animationFrameId.current = requestAnimationFrame(updatePhysics);
    };

    animationFrameId.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const handleCardHover = (id: string, isHovered: boolean) => {
    const updated = cardsRef.current.map((c) =>
      c.id === id ? { ...c, isHovered } : c
    );
    cardsRef.current = updated;
    setFloatingCards(updated);
  };

  // Form inside the Message Board tab (to post directly if unlocked)
  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/v1/declarations", declForm);
      setDeclForm({ name: "", country: "", message: "" });
      fetchMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const calculateStress = (income: number, rent: number, mortgage: number, living: number) => {
    const outgoings = rent + mortgage + living;
    const ratio = (outgoings / (income || 1)) * 100;
    return Math.min(Math.round(ratio), 150);
  };

  return (
    <div className="flex-1 min-h-[500px] lg:h-full relative flex items-center justify-center bg-slate-950/20 border border-slate-900/50 rounded-3xl overflow-hidden pointer-events-none select-none">
      {/* 1. Background Grid & SVG World Map */}
      <div className="absolute inset-0 z-0 opacity-[0.65] flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          <svg className="w-[95%] h-[95%] transition-colors duration-500" fill="none" viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="tactical-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(71, 85, 105, 0.18)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="1000" height="600" fill="url(#tactical-grid)" />
            
            {/* Outlines of continents */}
            <path d="M 290 60 L 340 50 L 360 80 L 320 100 L 280 85 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.45)" strokeWidth="1.5" />
            <path d="M 120 120 L 140 100 L 190 90 L 250 80 L 290 85 L 340 100 L 320 130 L 350 150 L 310 180 L 280 185 L 290 220 L 250 250 L 240 280 L 210 320 L 200 350 L 190 350 L 205 290 L 175 250 L 195 210 L 155 190 L 135 200 L 115 170 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.45)" strokeWidth="1.5" />
            <path d="M 315 270 L 345 285 L 375 320 L 415 365 L 430 400 L 410 450 L 380 500 L 360 540 L 350 540 L 355 480 L 335 430 L 315 380 L 295 330 L 305 295 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.45)" strokeWidth="1.5" />
            <path d="M 460 140 L 485 130 L 515 125 L 540 135 L 560 150 L 550 180 L 525 210 L 485 220 L 465 200 L 450 180 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.45)" strokeWidth="1.5" />
            <path d="M 470 230 L 525 220 L 550 235 L 585 240 L 610 265 L 615 300 L 590 350 L 565 410 L 555 460 L 540 460 L 535 410 L 510 360 L 480 320 L 465 280 L 460 250 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.45)" stroke-width="1.5" />
            <path d="M 590 410 L 605 400 L 615 425 L 600 445 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.45)" stroke-width="1.5" />
            <path d="M 545 135 L 590 120 L 650 110 L 710 105 L 790 115 L 850 130 L 880 155 L 860 185 L 820 220 L 840 250 L 800 290 L 760 310 L 745 280 L 715 260 L 685 280 L 665 260 L 640 270 L 620 250 L 585 245 L 560 215 L 565 175 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.45)" stroke-width="1.5" />
            <path d="M 720 310 L 755 315 L 740 335 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.45)" stroke-width="1.5" />
            <path d="M 765 320 L 795 310 L 815 335 L 785 355 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.45)" stroke-width="1.5" />
            <path d="M 805 440 L 850 420 L 885 435 L 890 470 L 860 500 L 810 490 L 795 465 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.45)" stroke-width="1.5" />
            <path d="M 900 515 L 915 510 L 905 540 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.45)" stroke-width="1.5" />
            <path d="M 150 570 L 850 570 L 800 590 L 200 590 Z" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(148, 163, 184, 0.45)" stroke-width="1.5" />
          </svg>

          {/* 2. Interactive Heatmap Nodes */}
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

      {/* 3. Floating Drifting Cards Container */}
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        {floatingCards.map((card) => {
          const stress = calculateStress(card.income, card.rent, card.mortgage, card.living);
          const isHighStress = stress > 80;
          const isMediumStress = stress > 50 && stress <= 80;

          const avatar = card.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120";

          return (
            <div
              key={card.id}
              className="floating-card bg-slate-900/85 backdrop-blur-md border border-slate-800/80 p-4 rounded-xl shadow-lg flex flex-col gap-3 w-72 pointer-events-auto select-text"
              style={{
                transform: `translate3d(${card.x}px, ${card.y}px, 0px) rotate(${card.rotate}deg)`,
                opacity: card.opacity,
                zIndex: card.isHovered ? 50 : 10
              }}
              onMouseEnter={() => handleCardHover(card.id, true)}
              onMouseLeave={() => handleCardHover(card.id, false)}
            >
              <div className="flex items-center gap-3">
                <img src={avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-slate-100 truncate">{card.name}</h4>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <MapPin size={10} className="text-rose-500 shrink-0" />
                    <span className="truncate">{card.country}</span>
                  </p>
                </div>
                <span
                  className={clsx(
                    "text-[9px] font-bold border px-2 py-0.5 rounded-full shrink-0",
                    isHighStress ? "text-rose-500 border-rose-950 bg-rose-950/20 animate-pulse" : isMediumStress ? "text-amber-400 border-amber-950 bg-amber-950/20" : "text-emerald-400 border-emerald-950 bg-emerald-950/20"
                  )}
                >
                  壓力指數: {stress}%
                </span>
              </div>
              <div className="text-[11px] text-slate-300 leading-relaxed italic border-l-2 border-rose-500/50 pl-2 bg-slate-950/30 py-1.5 pr-1 rounded-r">
                "{card.cry}"
              </div>
              <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-slate-800/60 pt-2">
                <span>月入: ${card.income} USD</span>
                <span>
                  住居比:{" "}
                  {Math.round(((card.rent + card.mortgage) / (card.income || 1)) * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Map Legend (Bottom-Left of map container) */}
      <div className="absolute bottom-6 left-6 z-20 bg-slate-950/85 border border-slate-800/80 p-3 rounded-xl backdrop-blur-md flex flex-col gap-2 text-[10px] shadow-xl pointer-events-auto transition hover:border-rose-900/45 max-w-[200px]">
        <div className="flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
          <i className="fa-solid fa-fire-flame-curved text-rose-500 animate-pulse"></i>
          <span className="text-slate-400 font-bold uppercase tracking-wider">全球吶喊熱力指數</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-rose-950/40 border border-rose-900/60"></span>
              平靜 (&lt; 2k)
            </span>
            <span className="font-mono text-slate-600">Low</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-rose-800/60 shadow-sm shadow-rose-800/30"></span>
              發熱 (2k - 15k)
            </span>
            <span className="font-mono text-rose-800/80">Med</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-rose-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-md shadow-rose-500"></span>
              超載 (15k+)
            </span>
            <span className="font-mono text-rose-500 animate-pulse">Critical</span>
          </div>
        </div>
      </div>

      {/* 5. Toggleable Glassmorphism Dashboard Widget (Bottom-Right/Floating) */}
      <div className="absolute bottom-6 right-6 z-35 pointer-events-auto flex flex-col items-end gap-2">
        {!widgetOpen && (
          <button
            onClick={() => setWidgetOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-lg text-xs font-bold transition cursor-pointer"
          >
            <Eye size={14} /> 顯示數據終端
          </button>
        )}

        {widgetOpen && (
          <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl backdrop-blur-xl shadow-2xl w-96 flex flex-col max-h-[460px] text-slate-100">
            {/* Widget Header */}
            <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-3">
              <span className="text-rose-500 text-xs font-black tracking-widest uppercase flex items-center gap-1.5">
                <Trophy size={14} className="text-rose-500 animate-pulse" />數據終端
              </span>
              <button
                onClick={() => setWidgetOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-xs transition cursor-pointer"
              >
                隱藏
              </button>
            </div>

            {/* Tab buttons */}
            <div className="flex bg-slate-950/40 border border-slate-900 rounded-lg p-1 mb-3">
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={clsx(
                  "flex-1 py-1.5 text-xs font-bold rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === "leaderboard" ? "bg-rose-950/40 text-rose-400 border border-rose-900/50" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Trophy size={12} /> 排行榜
              </button>
              <button
                onClick={() => setActiveTab("messageBoard")}
                className={clsx(
                  "flex-1 py-1.5 text-xs font-bold rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === "messageBoard" ? "bg-rose-950/40 text-rose-400 border border-rose-900/50" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <MessageSquare size={12} /> 全球吶喊 {!unlocked && <Lock size={12} className="text-rose-500" />}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto pr-1">
              {activeTab === "leaderboard" && (
                <div className="flex flex-col gap-2">
                  {leaderboard.length === 0 ? (
                    <p className="text-slate-500 text-xs italic text-center py-4">No protest data yet.</p>
                  ) : (
                    leaderboard.slice(0, 10).map((entry, idx) => (
                      <div key={entry.countryCode} className="flex justify-between items-center bg-slate-900/60 border border-slate-800/50 p-2.5 rounded-lg">
                        <span className="font-bold text-xs text-slate-300">
                          #{idx + 1} <span className="font-mono text-white text-sm ml-1.5">{entry.countryCode}</span>
                        </span>
                        <span className="text-[10px] font-bold bg-rose-950/50 border border-rose-900/70 text-rose-400 px-2 py-0.5 rounded-full">
                          {entry.submissionCount} 吶喊
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "messageBoard" && (
                <div className="relative min-h-[200px] h-full flex flex-col">
                  {/* Locked Overlay */}
                  {!unlocked && (
                    <div className="absolute inset-0 bg-slate-950/95 z-20 flex flex-col items-center justify-center text-slate-400 p-4 text-center rounded-xl">
                      <Lock size={32} className="mb-2 text-rose-500 animate-pulse" />
                      <h4 className="text-xs font-bold text-slate-100">保護區已鎖定</h4>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-[220px] leading-relaxed">
                        你必須先在左側發射一份生存報告，以此建立與全球的去中心化共識連線。
                      </p>
                    </div>
                  )}

                  {/* Unlocked Message List */}
                  <div className={clsx("flex-1 flex flex-col gap-3 transition-opacity duration-500", unlocked ? "opacity-100" : "opacity-30")}>
                    {/* Declaration Sub-Form */}
                    <form onSubmit={handlePostMessage} className="bg-slate-900/40 border border-slate-900 p-2.5 rounded-lg flex flex-col gap-2 text-xs">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="代號"
                          required
                          value={declForm.name}
                          onChange={(e) => setDeclForm({ ...declForm, name: e.target.value })}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 focus:outline-none focus:border-rose-500"
                        />
                        <input
                          type="text"
                          placeholder="國家 / 城市"
                          required
                          value={declForm.country}
                          onChange={(e) => setDeclForm({ ...declForm, country: e.target.value })}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <textarea
                        placeholder="在此對世界宣告你的困境與反抗..."
                        required
                        value={declForm.message}
                        onChange={(e) => setDeclForm({ ...declForm, message: e.target.value })}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 h-12 text-[11px] focus:outline-none focus:border-rose-500 resize-none"
                      />
                      <button
                        type="submit"
                        className="bg-rose-700 hover:bg-rose-600 text-white font-bold py-1 rounded cursor-pointer transition text-[11px]"
                      >
                        發表宣言
                      </button>
                    </form>

                    {/* Messages scroll area */}
                    <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                      {messages.length === 0 ? (
                        <p className="text-slate-500 text-xs italic text-center py-4">No messages yet.</p>
                      ) : (
                        messages.map((msg) => (
                          <div key={msg.id} className="bg-slate-900/60 border-l-2 border-rose-500 border border-slate-800/40 p-2.5 rounded-r-lg text-xs">
                            <div className="flex justify-between items-baseline mb-1 text-[10px]">
                              <span className="font-extrabold text-rose-400">{msg.name}</span>
                              <span className="text-slate-500">{msg.country}</span>
                            </div>
                            <p className="text-slate-300 leading-normal text-[11px]">{msg.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
