export type HackernewsItem = {
  id: number;
  title: string;
  url: string | null;
  descendants: number | null;
  by?: string;
  score?: number;
  time?: number;
  type?: string;
};
