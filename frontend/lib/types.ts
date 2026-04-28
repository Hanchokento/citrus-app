export type TasteInput = {
  brix: number;
  acid: number;
  bitterness: number;
  aroma: number;
  moisture: number;
  texture: number;
};

export type RankedItem = {
  id: number;
  rank: number;
};

export type RecommendationItem = {
  id: number;
  rank: number;
  name: string;
  description: string;
  imageUrl: string;
  features: TasteInput;
  amazonUrl?: string;
  rakutenUrl?: string;
  satofuruUrl?: string;
};

export type UserInfo = {
  userId: string;
  name: string;
  pictureUrl?: string;
  provider: "line";
};
