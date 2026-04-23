import type { Views } from "../App.tsx";
import ViewToggle from "./ViewToggle";

type Props = {
  activeView: Views;
  onViewChange: (newView: Views) => void;
};

export default function AppHeader(props: Props) {
  return (
    <header className="mb-10 border-b border-border pb-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-ui text-[0.65rem] font-bold uppercase tracking-[0.3em] text-primary">
            Currit
          </p>
          <h1 className="font-ui text-3xl font-bold uppercase leading-none tracking-[0.04em] text-text sm:text-4xl">
            Daily signal
          </h1>
        </div>
        <p className="max-w-sm font-reading text-sm leading-relaxed text-text-muted">
          A finite feed for better links, calmer reading, and fewer default
          scroll sessions.
        </p>
      </div>

      <ViewToggle
        activeView={props.activeView}
        onViewChange={props.onViewChange}
      />
    </header>
  );
}
