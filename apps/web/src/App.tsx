import { useState } from "react";
import Feed from "./components/Feed";
import Sources from "./components/Sources";
import Bookmarked from "./components/Bookmarked";
import AppHeader from "./components/AppHeader";

export type Views = "feed" | "sources" | "bookmarked";

function App() {
  const [activeView, setActiveView] = useState<Views>("feed");

  function handleViewChange(newView: Views) {
    setActiveView(newView);
  }

  return (
    <main className="min-h-screen bg-bg text-text">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        <AppHeader activeView={activeView} onViewChange={handleViewChange} />

        <section className="flex-1">
          {
            {
              feed: <Feed />,
              sources: <Sources />,
              bookmarked: <Bookmarked />,
            }[activeView]
          }
        </section>
      </div>
    </main>
  );
}

export default App;
