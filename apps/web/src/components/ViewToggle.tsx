import type { Views } from "../App.tsx";

type Props = {
  onViewChange: (newView: Views) => void;
};

export default function ViewToggle(props: Props) {
  return (
    <div style={{ display: "block", marginBottom: "1rem" }}>
      <button onClick={() => props.onViewChange("feed")}>Feed</button>
      <button onClick={() => props.onViewChange("sources")}>Sources</button>
      <button onClick={() => props.onViewChange("bookmarked")}>
        Bookmarked
      </button>
    </div>
  );
}
