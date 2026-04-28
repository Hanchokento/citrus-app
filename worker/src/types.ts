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

export type DiagnosisLogInput = {
  session_id: string;
  user_id?: string | null;
  input_json: TasteInput;
  result: RankedItem[];
};
