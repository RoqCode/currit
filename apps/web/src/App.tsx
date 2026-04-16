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
    <>
      <ViewToggle onViewChange={handleViewChange} />

      {
        {
          feed: <Feed />,
          sources: <Sources />,
          bookmarked: <Bookmarked />,
        }[activeView]
      }
    </>
  );
}

export default App;
