export type Offer = {
  slug: string;
  qty: 1 | 2 | 3;
  price: number;
  compareAt: number;
  save: number;
  title: string;
};

export const CATALOG_OFFER = {
  qty: 1 as const,
  price: 199,
  compareAt: 279,
  save: 80,
};
