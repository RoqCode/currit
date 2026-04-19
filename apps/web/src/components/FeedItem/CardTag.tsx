import type { SourceType } from "@currit/shared/types/CreateSourceInput";

type Props = {
  type: SourceType;
};

export default function CardTag(props: Props) {
  return <span>{props.type.toUpperCase()}</span>;
}
