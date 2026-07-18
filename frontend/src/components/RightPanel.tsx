import { useState, useEffect } from "react";
import axios from "axios";
import { Lock } from "lucide-react";
import { clsx } from "clsx";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { getIso3 } from "../utils/countryMapping";

interface RightPanelProps {
  unlocked: boolean;
}

interface LeaderboardEntry {
  countryCode: string;
  submissionCount: number;
  averageBurdenScore: number;
}

interface DeclarationEntry {
  id: string;
  name: string;
  country: string;
  message: string;
  createdAt: string;
}

export function RightPanel({ unlocked }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<"messageBoard" | "leaderboard" | "heatmap">("heatmap");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [messages, setMessages] = useState<DeclarationEntry[]>([]);

  const geoUrl = "/features.json";

  const colorScale = scaleLinear<string>()
    .domain([0, 100])
    .range(["#fef2f2", "#991b1b"]); // Light red to Dark red

  const [declForm, setDeclForm] = useState({ name: "", country: "", message: "" });

  useEffect(() => {
    fetchLeaderboard();
    if (unlocked) {
      fetchMessages();
    }
  }, [unlocked]);

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get("/api/v1/leaderboard");
      setLeaderboard(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get("/api/v1/declarations");
      setMessages(res.data);
    } catch (e) {
      console.error(e);
    }
  };

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

  return (
    <div className="w-1/2 h-screen bg-gray-100 flex flex-col relative overflow-hidden">
      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200">
        <button
          className={clsx("flex-1 py-4 font-semibold", activeTab === "heatmap" ? "border-b-2 border-black" : "text-gray-500")}
          onClick={() => setActiveTab("heatmap")}
        >
          Global Heatmap
        </button>
        <button
          className={clsx("flex-1 py-4 font-semibold", activeTab === "leaderboard" ? "border-b-2 border-black" : "text-gray-500")}
          onClick={() => setActiveTab("leaderboard")}
        >
          Leaderboard
        </button>
        <button
          className={clsx("flex-1 py-4 font-semibold flex items-center justify-center gap-2", activeTab === "messageBoard" ? "border-b-2 border-black" : "text-gray-500")}
          onClick={() => setActiveTab("messageBoard")}
        >
          Message Board {!unlocked && <Lock size={16} />}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        {activeTab === "heatmap" && (
          <div>
             <h2 className="text-2xl font-bold mb-6">Worldwide Living Cost Burden</h2>
             <p className="mb-4 text-sm text-gray-600">Map colors reflect the "True Burden Score" averaged over local submissions, incorporating basic PPP adjustments.</p>
             <div className="w-full border border-gray-300 rounded shadow-sm bg-white overflow-hidden">
               <ComposableMap>
                 <Geographies geography={geoUrl}>
                   {({ geographies }) =>
                     geographies.map((geo) => {
                       const d = leaderboard.find((s) => getIso3(s.countryCode) === geo.id);
                       return (
                         <Geography
                           key={geo.rsmKey}
                           geography={geo}
                           fill={d && d.averageBurdenScore ? colorScale(d.averageBurdenScore) : "#EAEAEC"}
                           stroke="#D6D6DA"
                           style={{
                             default: { outline: "none" },
                             hover: { fill: "#F53", outline: "none" },
                             pressed: { fill: "#E42", outline: "none" },
                           }}
                         />
                       );
                     })
                   }
                 </Geographies>
               </ComposableMap>
             </div>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Top Protesting Nations</h2>
            <div className="flex flex-col gap-4">
              {leaderboard.length === 0 ? (
                <p className="text-gray-500">No data available yet.</p>
              ) : (
                leaderboard.map((entry, idx) => (
                  <div key={entry.countryCode} className="flex flex-col bg-white p-4 shadow rounded">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xl text-gray-700">#{idx + 1} {entry.countryCode}</span>
                      <span className="text-sm font-medium bg-black text-white px-3 py-1 rounded-full">
                        {entry.submissionCount} Submissions
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Average Burden Score: <span className="font-semibold">{entry.averageBurdenScore.toFixed(1)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "messageBoard" && (
          <div className="relative h-full">
            {/* Locked Overlay */}
            {!unlocked && (
              <div className="absolute inset-0 bg-gray-100 z-10 flex flex-col items-center justify-center text-gray-500 transition-opacity duration-1000">
                <Lock size={64} className="mb-4 text-black" />
                <h2 className="text-xl font-bold text-black">The Sanctuary is Locked</h2>
                <p className="mt-2 text-center max-w-md">
                  You must cast off the weights of capitalism, rent, and inflation on the left to unlock the global message board.
                </p>
              </div>
            )}

            {/* Unlocked Content */}
            <div className={clsx("transition-opacity duration-1000", unlocked ? "opacity-100" : "opacity-0")}>
              <h2 className="text-2xl font-bold mb-6">Global Declarations</h2>

              <form onSubmit={handlePostMessage} className="mb-8 bg-white p-4 shadow rounded flex flex-col gap-4">
                <div className="flex gap-4">
                  <input
                    type="text" placeholder="Name/Alias" required className="border p-2 rounded flex-1"
                    value={declForm.name} onChange={(e) => setDeclForm({ ...declForm, name: e.target.value })}
                  />
                  <input
                    type="text" placeholder="Country" required className="border p-2 rounded flex-1"
                    value={declForm.country} onChange={(e) => setDeclForm({ ...declForm, country: e.target.value })}
                  />
                </div>
                <textarea
                  placeholder="Your declaration to the world..." required className="border p-2 rounded h-24"
                  value={declForm.message} onChange={(e) => setDeclForm({ ...declForm, message: e.target.value })}
                ></textarea>
                <button type="submit" className="bg-black text-white font-bold py-2 rounded">Post Message</button>
              </form>

              <div className="flex flex-col gap-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="bg-white p-4 shadow rounded border-l-4 border-black">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="font-bold">{msg.name}</span>
                      <span className="text-xs text-gray-500">{msg.country}</span>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
