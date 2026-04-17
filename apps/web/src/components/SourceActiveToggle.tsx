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
    <>
      {pending ? (
        "Pending"
      ) : (
        <div style={{ display: "inline-flex", flexDirection: "column" }}>
          <input
            onChange={handleSetActive}
            type="checkbox"
            checked={props.isActive}
          />
          <span>active</span>
        </div>
      )}
    </>
  );
}
