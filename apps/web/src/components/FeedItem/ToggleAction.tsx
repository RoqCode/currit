type Props = {
  onToggle: () => void;
  state: boolean;
  label: string;
};

export default function ToggleAction(props: Props) {
  return (
    <button
      type="button"
      aria-pressed={props.state}
      onClick={props.onToggle}
      className={`border px-3 py-2 font-ui text-[0.65rem] font-bold uppercase tracking-[0.16em] transition-colors ${
        props.state
          ? "border-primary bg-primary text-bg hover:border-primary-hover hover:bg-primary-hover"
          : "border-border bg-transparent text-text-muted hover:border-primary hover:text-primary"
      }`}
    >
      {props.label}
    </button>
  );
}
