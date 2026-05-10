import { useEffect, useState } from "react";
import type { Source } from "@currit/shared/types/Source";
import SourceForm from "./SourceForm";
import DeleteSourceButton from "./DeleteSourceButton";
import SourceActiveToggle from "./SourceActiveToggle";

function getSourceTypeLabel(type: Source["type"]) {
  switch (type) {
    case "hn":
      return "Hacker News";
    case "rss":
      return "RSS";
    case "subreddit":
      return "Reddit";
    default:
      return type;
  }
}

export default function Sources() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function fetchSources() {
    // get sources from db

    setError(false);
    setLoading(true);
    try {
      const res = await fetch("/api/sources");
      if (!res.ok) {
        throw new Error("failed to fetch sources");
      }
      const data = await res.json();

      const sortedSources = [...data.sources].sort((a, b) => {
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }
        if (a.isBuiltin !== b.isBuiltin) {
          return a.isBuiltin ? -1 : 1;
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

  if (error && !sources.length) {
    return (
      <p className="border border-border bg-surface p-4 font-ui text-sm text-primary">
        Could not load sources.
      </p>
    );
  }

  if (loading && !sources.length) {
    return (
      <p className="font-ui text-sm uppercase tracking-[0.16em] text-text-muted">
        Loading sources...
      </p>
    );
  }

  if (sources) {
    const sourceGroups = sources.reduce<
      Array<{ type: Source["type"]; sources: Source[] }>
    >((groups, source) => {
      const currentGroup = groups.at(-1);

      if (currentGroup?.type === source.type) {
        currentGroup.sources.push(source);
        return groups;
      }

      groups.push({ type: source.type, sources: [source] });
      return groups;
    }, []);

    return (
      <div className="space-y-8">
        <SourceForm onCreated={fetchSources} />

        <section>
          <div className="mb-4 flex items-end justify-between gap-4 border-b border-border pb-3">
            <div>
              <p className="mb-1 font-ui text-[0.65rem] font-bold uppercase tracking-[0.24em] text-primary">
                Inputs
              </p>
              <h2 className="font-ui text-xl font-bold uppercase tracking-[0.16em] text-text">
                Sources
              </h2>
            </div>
            <p className="font-ui text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
              {sources.length} total
            </p>
          </div>

          {sources.length ? (
            <div className="space-y-6">
              {sourceGroups.map((group) => (
                <div key={group.type}>
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="font-ui text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
                      {getSourceTypeLabel(group.type)}
                    </h3>
                    <span className="h-px flex-1 bg-border" />
                    <span className="font-ui text-[0.65rem] font-bold uppercase tracking-[0.16em] text-text-muted">
                      {group.sources.length}
                    </span>
                  </div>

                  <ul className="flex flex-col gap-3">
                    {group.sources.map((source) => (
                      <li
                        key={source.id}
                        className="border border-border bg-surface p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="border border-border px-2 py-1 font-ui text-[0.65rem] font-bold uppercase tracking-[0.18em] text-text-muted">
                                {source.type}
                              </span>
                              {source.isBuiltin ? (
                                <span className="bg-primary px-2 py-1 font-ui text-[0.65rem] font-bold uppercase tracking-[0.18em] text-bg">
                                  Built-in
                                </span>
                              ) : null}
                            </div>
                            <h3 className="font-ui text-lg font-bold text-text">
                              {source.name}
                            </h3>
                            <p className="mt-1 break-words font-reading text-sm leading-relaxed text-text-muted">
                              {source.url}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <SourceActiveToggle
                              uuid={source.id}
                              onActiveToggle={fetchSources}
                              isActive={source.active}
                            />
                            {source.isBuiltin ? null : (
                              <DeleteSourceButton
                                uuid={source.id}
                                onDeleted={fetchSources}
                              />
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="border border-border bg-surface p-4 font-reading text-sm text-text-muted">
              No sources yet. Add one above to start building your feed.
            </p>
          )}
        </section>
      </div>
    );
  }
}
