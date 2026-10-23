// Shared by the server (building the index) and the browser (loading it): MiniSearch needs the same options on both sides.
import type { Options } from "minisearch";

export interface SearchDoc {
  id: string;
  title: string;
  domain: string;
  type: string;
  questions: string;
  aliases: string;
  keywords: string;
  sections: string;
  identifiers: string;
}

export const SEARCH_OPTIONS: Options<SearchDoc> = {
  fields: ["title", "questions", "aliases", "keywords", "sections", "identifiers", "domain"],
  storeFields: ["title", "domain", "type"],
  searchOptions: {
    boost: { title: 4, questions: 3, aliases: 3, keywords: 2, sections: 2, identifiers: 2, domain: 1 },
    prefix: true,
    fuzzy: 0.2,
    combineWith: "AND",
  },
};
