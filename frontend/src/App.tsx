import { useState } from 'react';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';

function App() {
  const [unlocked, setUnlocked] = useState(false);

  const handleUnlock = () => {
    setUnlocked(true);
  };

  return (
    <div className="flex w-full min-h-screen">
      <LeftPanel onAllBurdensCleared={handleUnlock} />
      <RightPanel unlocked={unlocked} />
    </div>
  );
}

export default App;
