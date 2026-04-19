import { useState } from "react";
import Feed from "./components/Feed";
import Sources from "./components/Sources";
import ViewToggle from "./components/ViewToggle";
import Bookmarked from "./components/Bookmarked";

export type Views = "feed" | "sources" | "bookmarked";

function App() {
  const [activeView, setActiveView] = useState<Views>("feed");

  function handleViewChange(newView: Views) {
    setActiveView(newView);
  }

  return (
    <main className="min-h-screen bg-bg text-text ">
      <div className="max-w-5xl m-auto px-4 py-8">
        <ViewToggle onViewChange={handleViewChange} />

        {
          {
            feed: <Feed />,
            sources: <Sources />,
            bookmarked: <Bookmarked />,
          }[activeView]
        }
      </div>
    </main>
  );
}

export default App;
