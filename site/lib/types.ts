export type Kind = "paper" | "tool" | "news";
export interface SourceImage {
  url: string;
  alt: string;
  source: string;
  credit: string;
  position?: string;
  fit?: "cover" | "contain";
  originalUrl?: string;
  width?: number;
  height?: number;
  variants?: { url: string; width: number }[];
}
export interface Entry {
  id: string;
  kind: Kind;
  title: string;
  summary: string;
  date: string;
  source: string;
  anchor: string;
  topics: string[];
  image?: SourceImage;
  priority?: string;
  evidence?: string;
}
export interface Daily {
  id: string;
  contentHash: string;
  date: string;
  title: string;
  headline: string;
  summary: string;
  status: string;
  path: string;
  sourceCount: number;
  topics: string[];
  highlights: Entry[];
  image?: SourceImage;
  issue?: number;
  prs: number[];
  readingMinutes: number;
  unresolvedSources: number;
  readingEdition?: { path: string; contentHash: string };
}
export interface Article extends Daily {
  events?: ArticleEvent[];
  html: string;
  bodyHtml: string;
  text: string;
  toc: { id: string; title: string; depth: number }[];
  targets: string[];
  images: SourceImage[];
  introductionHtml: string;
  archiveHtml: string;
  paperSummaries: Record<string, string>;
  paperTitles?: Record<string, string>;
  readingGuide?: {
    id: string;
    title: string;
    leadingHtml: string;
    bodyHtml: string;
    afterHtml: string;
    rows: {
      priority: string;
      title: string;
      anchor: string;
      sources: string[];
      details: { label: string; html: string }[];
    }[];
  };
}
export interface PortalIndex {
  schemaVersion: 1;
  updatedThrough: string;
  daily: Daily[];
  entries: Entry[];
  search: {
    id: string;
    kind: Kind | "daily";
    title: string;
    summary: string;
    date: string;
    topics: string[];
    url: string;
    text: string;
  }[];
}

export interface EventTags {
  techniques: string[];
  projects: string[];
  content: string[];
  sources: string[];
}
export interface EditorialEvent {
  id: string;
  anchor: string;
  title: string;
  group: "main" | "brief" | "paper" | "analysis";
  blocks: string[];
  aliases?: string[];
  guideRows?: number[];
  judgment?: string;
  priority?: string;
  tags: EventTags;
  hideFirstHeading?: boolean;
  images?: SourceImage[];
}
export interface ArticleEvent extends EditorialEvent {
  html: string;
  judgment: string;
  context: {label: string; html: string}[];
  sourceText: string;
  sections: {id:string; title:string}[];
}
export interface EditorialLayout {
  version: 1;
  events: EditorialEvent[];
  introduction: string[];
  archive: string[];
  omit: string[];
}
