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
    <div className="flex gap-2 items-center mb-2">
      <span>{parseType(props.sourceType)}</span>
      {props.sourceName ? (
        <span className="text-text-muted text-sm font-bold">
          {props.sourceName}
        </span>
      ) : null}
    </div>
  );
}
