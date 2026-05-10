import { useState } from "react";

type Props = {
  onActiveToggle: () => void | Promise<void>;
  uuid: string;
  isActive: boolean;
};

export default function SourceActiveToggle(props: Props) {
  const [pending, setPending] = useState(false);

  async function handleSetActive() {
    setPending(true);

    try {
      const res = await fetch(`/api/sources/${props.uuid}/active`, {
        method: "PATCH",
        body: JSON.stringify({
          active: !props.isActive,
        }),
      });

      if (!res.ok) {
        throw new Error("active update failed");
      }

      await props.onActiveToggle();
    } catch (e) {
      console.error(e);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      aria-pressed={props.isActive}
      disabled={pending}
      onClick={handleSetActive}
      className={`border px-3 py-2 font-ui text-[0.65rem] font-bold uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        props.isActive
          ? "border-primary bg-primary text-bg hover:border-primary-hover hover:bg-primary-hover"
          : "border-border bg-transparent text-text-muted hover:border-primary hover:text-primary"
      }`}
    >
      {pending ? "Saving..." : props.isActive ? "Active" : "Paused"}
    </button>
  );
}
