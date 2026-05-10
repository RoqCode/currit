import type { FeedReadStats } from "../App";

type Props = {
  feedReadStats: FeedReadStats;
};

export default function AppFooter(props: Props) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-ui text-[0.65rem] font-bold uppercase tracking-[0.18em] text-text-muted">
          Currit<span className="text-primary">.</span> v0.1
        </p>
        <p className="font-ui text-[0.65rem] uppercase tracking-[0.12em] text-text-muted">
          <span className="font-bold text-primary">
            {props.feedReadStats.read}
          </span>{" "}
          / {props.feedReadStats.total} articles today
        </p>
      </div>
    </footer>
  );
}
