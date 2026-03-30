import { useState } from "react";

type Props = {
  onDeleted: () => void | Promise<void>;
  uuid: string;
};

export default function DeleteSourceButton(props: Props) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
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
    <>
      <button
        onClick={handleDelete}
        style={{
          color: "red",
          fontWeight: "bold",
          marginLeft: "1rem",
          cursor: "pointer",
        }}
      >
        {pending ? "O" : "X"}
      </button>
    </>
  );
}
