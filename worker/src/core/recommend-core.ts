export type TasteInput = {
  brix: number;
  acid: number;
  bitterness: number;
  aroma: number;
  moisture: number;
  texture: number;
};

export type RecommendationResult = {
  id: number;
  rank: number;
};

export function calculateTop3Ids(input: TasteInput): RecommendationResult[] {
  console.log(input);

  return [
    { id: 1, rank: 1 },
    { id: 2, rank: 2 },
    { id: 3, rank: 3 }
  ];
}
