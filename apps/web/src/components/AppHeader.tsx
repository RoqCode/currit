import type { Views } from "../App.tsx";
import ViewToggle from "./ViewToggle";

type Props = {
  activeView: Views;
  onViewChange: (newView: Views) => void;
};

export default function AppHeader(props: Props) {
  return (
    <header className="mb-10 border-b border-border pb-6 flex flex-col justify-between sm:flex-row">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-ui text-[0.65rem] font-bold uppercase tracking-[0.3em] text-primary">
            Daily signal
          </p>
          <h1 className="font-ui text-3xl font-bold uppercase leading-none tracking-[0.2em] text-text sm:text-4xl">
            Currit<span className="text-primary">.</span>
          </h1>
        </div>
      </div>

      <ViewToggle
        activeView={props.activeView}
        onViewChange={props.onViewChange}
      />
    </header>
  );
}
