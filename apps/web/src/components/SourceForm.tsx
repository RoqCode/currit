import { useState } from "react";
import type { CreateSourceInput } from "@currit/shared/types/CreateSourceInput";

type Props = {
  onCreated: () => void | Promise<void>;
};

export default function SourceForm(props: Props) {
  const [formError, setFormError] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    const name = formData.get("sourceName");
    const url = formData.get("sourceUrl");

    if (!name || !url) {
      setFormError(true);
      return;
    } else if (formError) {
      setFormError(false);
    }

    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: String(name),
          url: String(url),
        } as CreateSourceInput),
      });

      if (!res.ok) {
        throw new Error("request failed");
      }

      await props.onCreated();
    } catch (e) {
      console.error(e);
      setFetchError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <h2>Add your sources</h2>
      <form action={handleSubmit}>
        <input type="text" placeholder="Source Name" name="sourceName" />
        <input type="text" placeholder="Source URL" name="sourceUrl" />
        <button type="submit">
          {pending ? "Submitting..." : "Submit Source"}
        </button>
        {formError && (
          <p style={{ color: "red" }}>
            You need to provide both a Name and a URL to proceed
          </p>
        )}
      </form>

      {fetchError && <p>Something went wrong while submitting source</p>}
    </>
  );
}
