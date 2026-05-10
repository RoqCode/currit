import { useState } from "react";

type Props = {
  onDeleted: () => void | Promise<void>;
  uuid: string;
};

export default function DeleteSourceButton(props: Props) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    console.log("deleting source");
    setPending(true);

    try {
      const res = await fetch(`/api/sources/${props.uuid}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("delete failed");
      }

      await props.onDeleted();
    } catch (e) {
      console.error(e);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="border border-border px-3 py-2 font-ui text-[0.65rem] font-bold uppercase tracking-[0.16em] text-text-muted transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}
