import type { Views } from "../App.tsx";

type Props = {
  onViewChange: (newView: Views) => void;
};

export default function ViewToggle(props: Props) {
  return (
    <div className="flex gap-2">
      <button className="border p-1" onClick={() => props.onViewChange("feed")}>
        Feed
      </button>
      <button
        className="border p-1"
        onClick={() => props.onViewChange("sources")}
      >
        Sources
      </button>
      <button
        className="border p-1"
        onClick={() => props.onViewChange("bookmarked")}
      >
        Bookmarked
      </button>
    </div>
  );
}
