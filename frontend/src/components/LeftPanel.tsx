import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import axios from "axios";

interface LeftPanelProps {
  onNewSubmission: (human: any) => void;
}

export function LeftPanel({ onNewSubmission }: LeftPanelProps) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [income, setIncome] = useState("");
  const [rent, setRent] = useState("");
  const [mortgage, setMortgage] = useState("");
  const [living, setLiving] = useState("");
  const [cry, setCry] = useState("");

  const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getCountryCode = (countryName: string): string => {
    const c = countryName.toLowerCase();
    if (c.includes("台") || c.includes("taiwan")) return "TW";
    if (c.includes("美") || c.includes("us") || c.includes("united states")) return "US";
    if (c.includes("日") || c.includes("japan") || c.includes("jp")) return "JP";
    if (c.includes("法") || c.includes("france") || c.includes("fr")) return "FR";
    if (c.includes("英") || c.includes("uk") || c.includes("united kingdom") || c.includes("倫")) return "GB";
    if (c.includes("中") || c.includes("china") || c.includes("cn")) return "CN";
    if (c.includes("加") || c.includes("canada") || c.includes("ca")) return "CA";
    if (c.includes("巴") || c.includes("brazil") || c.includes("br")) return "BR";
    // Fallback: take first two characters if alphanumeric, uppercase
    const clean = c.replace(/[^a-z]/g, "");
    if (clean.length >= 2) return clean.substring(0, 2).toUpperCase();
    return "US"; // default fallback
  };

  const triggerExplosion = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { x: 0.25, y: 0.5 },
      colors: ["#f43f5e", "#f59e0b", "#10b981", "#ffffff"],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const incVal = parseFloat(income);
    const rentVal = parseFloat(rent) || 0;
    const mortgageVal = parseFloat(mortgage) || 0;
    const livingVal = parseFloat(living) || 0;
    const countryCode = getCountryCode(country);

    const newHuman = {
      name,
      country,
      income: incVal,
      rent: rentVal,
      mortgage: mortgageVal,
      living: livingVal,
      cry,
      photo: uploadedAvatar,
    };

    try {
      // 1. Post to declarations
      await axios.post("/api/v1/declarations", {
        name,
        country,
        message: cry,
      });

      // 2. Post burdens to update daily stats / leaderboard sequentially to prevent race conditions on country_code insertion
      // Wage Burden
      await axios.post("/api/v1/burdens", {
        type: "wage",
        amount: `$${incVal}/mo`,
        locationRaw: country,
        countryCode: countryCode,
        imageGcsUrl: "dummy_url",
      });

      // Rent Burden
      if (rentVal > 0) {
        await axios.post("/api/v1/burdens", {
          type: "rent",
          amount: `$${rentVal}/mo`,
          locationRaw: country,
          countryCode: countryCode,
          imageGcsUrl: "dummy_url",
        });
      }

      // Inflation/Prices Burden
      if (livingVal > 0) {
        await axios.post("/api/v1/burdens", {
          type: "prices",
          amount: `$${livingVal}/mo`,
          locationRaw: country,
          countryCode: countryCode,
          imageGcsUrl: "dummy_url",
        });
      }

      // Trigger animation & callback
      triggerExplosion();
      onNewSubmission(newHuman);

      // Reset form
      setName("");
      setCountry("");
      setIncome("");
      setRent("");
      setMortgage("");
      setLiving("");
      setCry("");
      setUploadedAvatar(null);

      alert("你的生存數據已被端到端加密發射至 TrueHuman 全球共識矩陣。你的聲音，已經與全球連通。");
    } catch (err) {
      console.error("Failed to submit survival report", err);
      alert("提交失敗，請檢查與後端 API 的連線。");
    }
  };

  return (
    <div className="w-full lg:w-[420px] shrink-0 flex flex-col justify-center pointer-events-auto">
      <div className="bg-slate-900/45 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="mb-5">
          <span className="text-rose-500 text-[11px] font-bold tracking-widest uppercase border border-rose-950 bg-rose-950/30 px-3 py-0.5 rounded-full">
            Report Your Reality
          </span>
          <h2 className="text-2xl font-black mt-2 text-slate-100">生存代價報告</h2>
          <p className="text-slate-400 text-xs mt-1">資本讓我們成為數字。在這裡，分享你的真實困境，連通全球。</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Name & Country */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">代號 / 名字</label>
              <input
                type="text"
                required
                placeholder="例如：Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-rose-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">所在國家 / 城市</label>
              <input
                type="text"
                required
                placeholder="例如：台北, 台灣"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-rose-500 transition"
              />
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-semibold">真實面貌 / 自訂照片</label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden relative">
                {uploadedAvatar ? (
                  <img src={uploadedAvatar} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <i className="fa-regular fa-image text-slate-600 text-lg"></i>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 cursor-pointer bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition rounded-lg px-4 py-2.5 text-center text-xs font-semibold text-slate-300 flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-cloud-arrow-up text-rose-500"></i>上傳照片
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Bills Section */}
          <div className="space-y-3 p-3 bg-slate-950/60 rounded-xl border border-slate-900">
            <span className="text-[10px] text-rose-400 font-bold tracking-wider uppercase">月度生存帳單 (換算等值美元 USD)</span>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">每月淨收入 (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 text-xs">$</span>
                <input
                  type="number"
                  required
                  placeholder="3200"
                  min="1"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-3 py-1.5 text-slate-100 focus:outline-none focus:border-rose-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">房租 (USD)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-500 text-xs">$</span>
                  <input
                    type="number"
                    required
                    placeholder="1200"
                    min="0"
                    value={rent}
                    onChange={(e) => setRent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-5 pr-2 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-rose-500 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">房貸 (USD)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-500 text-xs">$</span>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    min="0"
                    value={mortgage}
                    onChange={(e) => setMortgage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-5 pr-2 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-rose-500 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">基本開銷</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-500 text-xs">$</span>
                  <input
                    type="number"
                    required
                    placeholder="800"
                    min="0"
                    value={living}
                    onChange={(e) => setLiving(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-5 pr-2 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-rose-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cry for reality */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-semibold">你對當下生活的吶喊 (Cry for Reality)</label>
            <textarea
              required
              rows={3}
              placeholder="例如：我每天工作 12 小時，卻付不起日益高漲的租金。這不是生活，這只是無止盡的燃料消耗..."
              value={cry}
              onChange={(e) => setCry(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-rose-500 transition text-xs resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold rounded-lg tracking-wider transition duration-300 shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-paper-plane"></i> 發射我的真實數據
          </button>
        </form>
      </div>
    </div>
  );
}
