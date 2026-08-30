import data from "./morocco-paths.json";

export type MoroccoRegionPath = {
  name: string;
  d: string;
  labelX: number;
  labelY: number;
};

export const MOROCCO_PATHS = data as MoroccoRegionPath[];
