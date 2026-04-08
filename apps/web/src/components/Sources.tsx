import { useEffect, useState } from "react";
import type { Source } from "@currit/shared/types/Source";
import SourceForm from "./SourceForm";
import DeleteSourceButton from "./DeleteSourceButton";
import SourceActiveToggle from "./SourceActiveToggle";

export default function Sources() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function fetchSources() {
    // get sources from db

    setLoading(true);
    try {
      const res = await fetch("/api/sources");
      if (!res.ok) {
        throw new Error("failed to fetch sources");
      }
      const data = await res.json();

      const sortedSources = [...data.sources].sort((a, b) => {
        if (a.isBuiltin !== b.isBuiltin) {
          return a.isBuiltin ? -1 : 1;
        }
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }
        return a.name.localeCompare(b.name);
      });

      setSources(sortedSources);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSources();
  }, []);

  if (error) {
    return (
      <>
        <p>whoops, fetch failed</p>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <p>loading</p>
      </>
    );
  }

  if (sources) {
    return (
      <>
        <SourceForm onCreated={fetchSources} />

        <ul>
          {sources.map((source) => (
            <li key={source.id}>
              <span style={{ fontStyle: "italic" }}>{source.type}</span> |{" "}
              {source.name} | {source.url}
              <SourceActiveToggle
                uuid={source.id}
                onActiveToggle={fetchSources}
                isActive={source.active}
              />
              {source.isBuiltin ? (
                ""
              ) : (
                <DeleteSourceButton uuid={source.id} onDeleted={fetchSources} />
              )}
            </li>
          ))}
        </ul>
      </>
    );
  }
}
