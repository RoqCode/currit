import { getAllSources } from "../sources/getAllSources";

type SourceRow = Awaited<ReturnType<typeof getAllSources>>[number];

type PollHnSourceParams = {
  source: SourceRow;
};

export default async function pollHnSource(params: PollHnSourceParams) {}
