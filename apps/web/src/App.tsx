import { useCallback, useEffect, useState } from "react";
import Feed from "./components/Feed";
import Sources from "./components/Sources";
import Bookmarked from "./components/Bookmarked";
import AppHeader from "./components/AppHeader";
import AppFooter from "./components/AppFooter";

export type Views = "feed" | "sources" | "bookmarked";
export type FeedReadStats = {
  read: number;
  total: number;
};

function App() {
  const [activeView, setActiveView] = useState<Views>("feed");
  const [feedReadStats, setFeedReadStats] = useState<FeedReadStats>({
    read: 0,
    total: 0,
  });

  const handleFeedStatsChange = useCallback((nextStats: FeedReadStats) => {
    setFeedReadStats(nextStats);
  }, []);

  useEffect(() => {
    document.title = feedReadStats.total
      ? `Currit | ${feedReadStats.read}/${feedReadStats.total}`
      : "Currit";
  }, [feedReadStats]);

  function handleViewChange(newView: Views) {
    setActiveView(newView);
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <AppHeader
        activeView={activeView}
        feedReadStats={feedReadStats}
        onViewChange={handleViewChange}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6">
        <section>
          {
            {
              feed: <Feed onStatsChange={handleFeedStatsChange} />,
              sources: <Sources />,
              bookmarked: <Bookmarked />,
            }[activeView]
          }
        </section>
      </main>

      <AppFooter feedReadStats={feedReadStats} />
    </div>
  );
}

export default App;
