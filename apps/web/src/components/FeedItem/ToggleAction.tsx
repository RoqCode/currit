type Props = {
  onToggle: () => void;
  state: boolean;
  label: string;
};

export default function ToggleAction(props: Props) {
  return (
    <div style={{ display: "inline-flex", flexDirection: "column" }}>
      <input type="checkbox" checked={props.state} onChange={props.onToggle} />
      <span>{props.label}</span>
    </div>
  );
}
