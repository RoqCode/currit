import { useState } from "react";
import type { CreateSourceInput } from "@currit/shared/types/CreateSourceInput";
import { createSourceDraftSchema } from "@currit/shared/validation/sourceInput";

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
    const parsedDraft = createSourceDraftSchema.safeParse({
      name: typeof name === "string" ? name : "",
      url: typeof url === "string" ? url : "",
    });

    if (!parsedDraft.success) {
      const hasMissingField = parsedDraft.error.issues.some(
        (issue: { message: string }) =>
          issue.message === "name is required" ||
          issue.message === "source url is required",
      );

      setFormError(hasMissingField);
      setTypeError(!hasMissingField);
      setFetchError(null);
      setPending(false);
      return;
    }

    if (formError || typeError) {
      setFormError(false);
      setTypeError(false);
    }
    setFetchError(null);

    const payload = parsedDraft.data;

    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: payload.name,
          url: payload.url,
          type: payload.type,
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
    <section className="border border-border bg-surface p-4 sm:p-5">
      <div className="mb-4">
        <p className="mb-1 font-ui text-[0.65rem] font-bold uppercase tracking-[0.24em] text-primary">
          Add source
        </p>
        <h2 className="font-ui text-xl font-bold uppercase tracking-[0.16em] text-text">
          Feed inputs
        </h2>
      </div>

      <form action={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]">
          <label className="flex flex-col gap-1">
            <span className="font-ui text-[0.65rem] font-bold uppercase tracking-[0.18em] text-text-muted">
              Name
            </span>
            <input
              type="text"
              placeholder="Hacker News"
              name="sourceName"
              className="border border-border bg-bg px-3 py-2 font-ui text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-ui text-[0.65rem] font-bold uppercase tracking-[0.18em] text-text-muted">
              URL
            </span>
            <input
              type="text"
              placeholder="https://example.com/feed.xml"
              name="sourceUrl"
              className="border border-border bg-bg px-3 py-2 font-ui text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-primary"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="self-end border border-primary bg-primary px-4 py-2 font-ui text-xs font-bold uppercase tracking-[0.16em] text-bg transition-colors hover:border-primary-hover hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Submitting..." : "Submit"}
          </button>
        </div>

        {formError && (
          <p className="font-ui text-sm text-primary">
            You need to provide both a Name and a URL to proceed
          </p>
        )}
        {typeError && (
          <p className="font-ui text-sm text-primary">
            The source URL you provided is currently not supported
          </p>
        )}
      </form>

      {fetchError && <p className="mt-3 font-ui text-sm text-primary">{fetchError}</p>}
    </section>
  );
}
