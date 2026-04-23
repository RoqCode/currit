import type { Views } from "../App.tsx";

type Props = {
  activeView: Views;
  onViewChange: (newView: Views) => void;
};

const views: Array<{ id: Views; label: string }> = [
  { id: "feed", label: "Feed" },
  { id: "sources", label: "Sources" },
  { id: "bookmarked", label: "Bookmarked" },
];

export default function ViewToggle(props: Props) {
  return (
    <nav aria-label="Primary navigation" className="flex flex-wrap gap-2">
      {views.map((view) => {
        const isActive = props.activeView === view.id;

        return (
          <button
            key={view.id}
            type="button"
            aria-current={isActive ? "page" : undefined}
            className={`border px-4 py-2 font-ui text-xs font-bold uppercase tracking-[0.16em] transition-colors ${
              isActive
                ? "border-primary bg-primary text-bg"
                : "border-border bg-transparent text-text-muted hover:border-primary hover:text-primary"
            }`}
            onClick={() => props.onViewChange(view.id)}
          >
            {view.label}
          </button>
        );
      })}
    </nav>
  );
}
