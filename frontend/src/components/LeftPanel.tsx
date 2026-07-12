import { useState } from "react";
import confetti from "canvas-confetti";
import axios from "axios";

interface BurdenState {
  wage: boolean;
  rent: boolean;
  prices: boolean;
}

interface LeftPanelProps {
  onAllBurdensCleared: () => void;
}

export function LeftPanel({ onAllBurdensCleared }: LeftPanelProps) {
  const [clearedBurdens, setClearedBurdens] = useState<BurdenState>({
    wage: false,
    rent: false,
    prices: false,
  });

  const [activeModal, setActiveModal] = useState<keyof BurdenState | null>(null);

  const [formData, setFormData] = useState({
    amount: "",
    location: "",
    countryCode: "US", // Default to US
  });

  const handleOpenModal = (type: keyof BurdenState) => {
    setActiveModal(type);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setFormData({ amount: "", location: "", countryCode: "US" });
  };

  const triggerExplosion = (x: number, y: number) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x, y },
      colors: ["#000000", "#555555", "#999999"],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    try {
      // Simulate submission or real submission
      await axios.post("/api/v1/burdens", {
        type: activeModal,
        amount: formData.amount,
        locationRaw: formData.location,
        countryCode: formData.countryCode,
        imageGcsUrl: "dummy_url",
      });

      const updatedBurdens = { ...clearedBurdens, [activeModal]: true };
      setClearedBurdens(updatedBurdens);

      // Trigger particle explosion effect roughly from center of left panel
      triggerExplosion(0.25, 0.5);

      if (updatedBurdens.wage && updatedBurdens.rent && updatedBurdens.prices) {
        onAllBurdensCleared();
      }

      handleCloseModal();
    } catch (error) {
      console.error("Failed to submit burden", error);
    }
  };

  const allCleared = clearedBurdens.wage && clearedBurdens.rent && clearedBurdens.prices;

  return (
    <div className="w-1/2 h-screen bg-white relative flex flex-col items-center justify-center p-8 border-r border-gray-200">
      <h2 className="text-2xl font-bold mb-8">The Burdened Human</h2>

      {/* SVG Stage */}
      <div className="relative w-64 h-96 flex items-center justify-center border-b-4 border-black">
        {/* Stickman SVG */}
        <svg
          viewBox="0 0 100 200"
          className="w-full h-full transition-transform duration-1000"
          style={{ transform: allCleared ? "scaleY(1)" : "scaleY(0.7) translateY(20%)" }}
        >
          {/* Head */}
          <circle cx="50" cy={allCleared ? "30" : "50"} r="15" fill="none" stroke="black" strokeWidth="4" />
          {/* Body */}
          <line x1="50" y1={allCleared ? "45" : "65"} x2="50" y2={allCleared ? "120" : "140"} stroke="black" strokeWidth="4" />
          {/* Arms */}
          <path
            d={allCleared ? "M 20 80 Q 50 60 80 80" : "M 20 100 Q 50 140 80 100"}
            fill="none"
            stroke="black"
            strokeWidth="4"
          />
          {/* Legs */}
          <path
            d={allCleared ? "M 50 120 L 30 190 M 50 120 L 70 190" : "M 50 140 L 20 190 M 50 140 L 80 190"}
            fill="none"
            stroke="black"
            strokeWidth="4"
          />
        </svg>

        {/* Overlay Weights */}
        {!allCleared && (
          <div className="absolute top-10 flex flex-col gap-4 w-full px-4">
            {!clearedBurdens.wage && (
              <button
                onClick={() => handleOpenModal("wage")}
                className="w-full bg-black text-white py-2 font-bold cursor-pointer hover:bg-gray-800 transition"
              >
                Capitalism (Low Wage)
              </button>
            )}
            {!clearedBurdens.rent && (
              <button
                onClick={() => handleOpenModal("rent")}
                className="w-full bg-black text-white py-2 font-bold cursor-pointer hover:bg-gray-800 transition"
              >
                High Rent
              </button>
            )}
            {!clearedBurdens.prices && (
              <button
                onClick={() => handleOpenModal("prices")}
                className="w-full bg-black text-white py-2 font-bold cursor-pointer hover:bg-gray-800 transition"
              >
                Inflation (Prices)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {activeModal && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96 text-black">
            <h3 className="text-xl font-bold mb-4 uppercase">
              {activeModal === "wage" ? "Submit Wage Burden" : activeModal === "rent" ? "Submit Rent Burden" : "Submit Price Burden"}
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Amount (e.g. $15/hr, $2000/mo)"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="border border-gray-300 p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Location (e.g. New York, USA)"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="border border-gray-300 p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Country Code (e.g. US, UK)"
                value={formData.countryCode}
                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                className="border border-gray-300 p-2 rounded"
                maxLength={2}
                required
              />
              <div className="flex flex-col">
                <label className="text-sm mb-1 text-gray-600">Proof of Receipt/Stub</label>
                <input type="file" className="text-sm" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-black text-white rounded">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
