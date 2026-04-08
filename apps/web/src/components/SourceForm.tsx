import { useState } from "react";
import type { CreateSourceInput } from "@currit/shared/types/CreateSourceInput";
import { parseSourceType } from "../utils/parseSourceType";

type Props = {
  onCreated: () => void | Promise<void>;
};

export default function SourceForm(props: Props) {
  const [formError, setFormError] = useState(false);
  const [typeError, setTypeError] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    const name = formData.get("sourceName");
    const url = formData.get("sourceUrl");
    const type = parseSourceType(String(url));

    if (!type) {
      setTypeError(true);
      setPending(false);
      return;
    }

    if (!name || !url) {
      setFormError(true);
      setPending(false);
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
          type: String(type),
        } as CreateSourceInput),
      });

      if (!res.ok) {
        let message = "Something went wrong while submitting source";
        try {
          const data = (await res.json()) as { error?: string };
          if (res.status === 409) {
            message = "This source already exists";
          } else if (data.error) {
            message = data.error;
          }
        } catch {
          // ignore invalid error body
        }
        throw new Error(message);
      }

      await props.onCreated();
    } catch (e) {
      console.error(e);
      setFetchError(
        e instanceof Error
          ? e.message
          : "Something went wrong while submitting source",
      );
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
        {typeError && (
          <p style={{ color: "red" }}>
            The source URL you provided is currently not supported
          </p>
        )}
      </form>

      {fetchError && <p style={{ color: "red" }}>{fetchError}</p>}
    </>
  );
}
