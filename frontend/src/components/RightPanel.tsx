import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Lock, MapPin, Eye, Trophy, MessageSquare } from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "../i18n/I18nContext";

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

const DEFAULT_MOCK_HUMANS: any[] = [];


export function RightPanel({ unlocked, lastSubmission }: RightPanelProps) {
  const { t } = useTranslation();
  // Tabs State
  const [activeTab, setActiveTab] = useState<"leaderboard" | "messageBoard">("leaderboard");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [messages, setMessages] = useState<DeclarationEntry[]>([]);
  const [declForm, setDeclForm] = useState({ name: "", country: "", message: "" });
  const [widgetOpen, setWidgetOpen] = useState(true);



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
    <div className="flex-1 min-h-[500px] lg:h-full relative flex items-center justify-center overflow-hidden pointer-events-none select-none">

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
                  {t("right.stress_index")}: {stress}%
                </span>
              </div>
              <div className="text-[11px] text-slate-300 leading-relaxed italic border-l-2 border-rose-500/50 pl-2 bg-slate-950/30 py-1.5 pr-1 rounded-r">
                "{card.cry}"
              </div>
              <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-slate-800/60 pt-2">
                <span>{t("right.monthly_income")}: ${card.income} USD</span>
                <span>
                  {t("right.housing_ratio")}:{" "}
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
          <span className="text-slate-400 font-bold uppercase tracking-wider">{t("right.legend_title")}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-rose-950/40 border border-rose-900/60"></span>
              {t("right.legend_low")}
            </span>
            <span className="font-mono text-slate-600">Low</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-rose-800/60 shadow-sm shadow-rose-800/30"></span>
              {t("right.legend_med")}
            </span>
            <span className="font-mono text-rose-800/80">Med</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-rose-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-md shadow-rose-500"></span>
              {t("right.legend_critical")}
            </span>
            <span className="font-mono text-rose-500 animate-pulse">Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
}
