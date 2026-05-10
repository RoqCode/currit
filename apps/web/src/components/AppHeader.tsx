import { useEffect, useRef, useState } from "react";
import type { FeedReadStats, Views } from "../App.tsx";
import ViewToggle from "./ViewToggle";

type Props = {
  activeView: Views;
  feedReadStats: FeedReadStats;
  onViewChange: (newView: Views) => void;
};

export default function AppHeader(props: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const lastScrollY = useRef(0);
  const progress = props.feedReadStats.total
    ? Math.round((props.feedReadStats.read / props.feedReadStats.total) * 100)
    : 0;

  useEffect(() => {
    function handleScroll() {
      const nextScrollY = window.scrollY;
      const isScrollingDown = nextScrollY > lastScrollY.current;

      if (nextScrollY < 16) {
        setIsCollapsed(false);
      } else if (Math.abs(nextScrollY - lastScrollY.current) > 4) {
        setIsCollapsed(isScrollingDown);
      }

      lastScrollY.current = nextScrollY;
    }

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-20 border-b border-border bg-surface transition-transform duration-200 ${
        isCollapsed ? "-translate-y-[calc(100%-4px)]" : "translate-y-0"
      }`}
    >
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center sm:gap-6">
          <div>
            <p className="mb-1 font-ui text-[0.6rem] font-bold uppercase tracking-[0.28em] text-primary">
              Daily signal
            </p>
            <h1 className="font-ui text-xl font-bold uppercase leading-none tracking-[0.22em] text-text sm:text-2xl">
              Currit<span className="text-primary">.</span>
            </h1>
          </div>

          <ViewToggle
            activeView={props.activeView}
            onViewChange={props.onViewChange}
          />
        </div>

        {props.activeView === "feed" ? (
          <div className="h-1 bg-border">
            <div
              className="h-full bg-primary transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}
