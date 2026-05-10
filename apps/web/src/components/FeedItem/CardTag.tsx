import type { SourceType } from "@currit/shared/types/CreateSourceInput";

type Props = {
  sourceType: SourceType;
  sourceName: string | null;
};

export default function CardTag(props: Props) {
  function parseType(type: SourceType) {
    switch (type) {
      case "rss":
        return "RSS";
      case "subreddit":
        return "RDT";
      case "hn":
        return "HN";
      default:
        return "UKN";
    }
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="border border-border px-2 py-1 font-ui text-[0.65rem] font-bold uppercase tracking-[0.18em] text-text-muted">
        {parseType(props.sourceType)}
      </span>
      {props.sourceName ? (
        <span className="font-ui text-[0.65rem] font-bold uppercase tracking-[0.18em] text-text-muted">
          {props.sourceName}
        </span>
      ) : null}
    </div>
  );
}
