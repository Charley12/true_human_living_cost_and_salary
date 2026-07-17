import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import axios from "axios";
import { useTranslation } from "../i18n/I18nContext";

interface LeftPanelProps {
  onNewSubmission: (human: any) => void;
}

export function LeftPanel({ onNewSubmission }: LeftPanelProps) {
  const { t } = useTranslation();
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
    if (c.includes("美") || c.includes("us") || c.includes("united states") || c.includes("america")) return "US";
    if (c.includes("日") || c.includes("japan") || c.includes("jp")) return "JP";
    if (c.includes("法") || c.includes("france") || c.includes("fr")) return "FR";
    if (c.includes("英") || c.includes("uk") || c.includes("united kingdom") || c.includes("倫") || c.includes("britain")) return "GB";
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

      alert(t("left.success"));
    } catch (err) {
      console.error("Failed to submit survival report", err);
      alert(t("left.error"));
    }
  };

  return (
    <div className="w-full lg:w-[420px] shrink-0 flex flex-col justify-center pointer-events-auto">
      <div className="bg-slate-900/45 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-slate-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="mb-5">
          <span className="text-slate-300 text-[11px] font-bold tracking-widest uppercase border border-slate-800 bg-slate-900/50 px-3 py-0.5 rounded-full">
            {t("left.badge")}
          </span>
          <h2 className="text-2xl font-black mt-2 text-slate-100">{t("left.title")}</h2>
          <p className="text-slate-400 text-xs mt-1">{t("left.desc")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Name & Country */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">{t("left.name_label")}</label>
              <input
                type="text"
                required
                placeholder={t("left.name_placeholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-slate-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">{t("left.city_label")}</label>
              <input
                type="text"
                required
                placeholder={t("left.city_placeholder")}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-slate-500 transition"
              />
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-semibold">{t("left.photo_label")}</label>
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
                <i className="fa-solid fa-cloud-arrow-up text-slate-400"></i>{t("left.photo_button")}
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
            <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">{t("left.bill_title")}</span>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">{t("left.income_label")}</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 text-xs">$</span>
                <input
                  type="number"
                  required
                  placeholder={t("left.income_placeholder")}
                  min="1"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-3 py-1.5 text-slate-100 focus:outline-none focus:border-slate-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">{t("left.rent_label")}</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-500 text-xs">$</span>
                  <input
                    type="number"
                    required
                    placeholder={t("left.rent_placeholder")}
                    min="0"
                    value={rent}
                    onChange={(e) => setRent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-5 pr-2 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-slate-500 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">{t("left.mortgage_label")}</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-500 text-xs">$</span>
                  <input
                    type="number"
                    required
                    placeholder={t("left.mortgage_placeholder")}
                    min="0"
                    value={mortgage}
                    onChange={(e) => setMortgage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-5 pr-2 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-slate-500 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">{t("left.living_label")}</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-500 text-xs">$</span>
                  <input
                    type="number"
                    required
                    placeholder={t("left.living_placeholder")}
                    min="0"
                    value={living}
                    onChange={(e) => setLiving(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-5 pr-2 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-slate-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cry for reality */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-semibold">{t("left.cry_label")}</label>
            <textarea
              required
              rows={3}
              placeholder={t("left.cry_placeholder")}
              value={cry}
              onChange={(e) => setCry(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-slate-500 transition text-xs resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-100 hover:bg-white text-slate-950 font-extrabold rounded-lg tracking-wider transition duration-300 shadow-lg shadow-slate-950/50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-paper-plane"></i> {t("left.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
