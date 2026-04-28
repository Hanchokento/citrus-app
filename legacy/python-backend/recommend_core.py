# backend/recommend_core.py
import math
from typing import List, Dict
import numpy as np
import pandas as pd

FEATURES = ["brix", "acid", "bitterness", "aroma", "moisture", "texture"]

ALIASES = {
    "brix": ["brix", "sweet", "sweetness", "sugar"],
    "acid": ["acid", "acidity", "sour", "sourness"],
    "bitterness": ["bitterness", "bitter"],
    "aroma": ["aroma", "smell", "fragrance", "flavor", "flavour"],
    "moisture": ["moisture", "juicy", "juiciness"],
    "texture": ["texture", "elastic", "firmness", "pulpiness"],
}

def _standardize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.rename(columns={c: c.strip().lower() for c in df.columns})
    if "season" not in df.columns:
        for cand in ["seasons", "season_pref", "in_season"]:
            if cand in df.columns:
                df = df.rename(columns={cand: "season"})
                break
    if "image_url" not in df.columns:
        for cand in ["image", "img", "img_url", "photo_url", "picture"]:
            if cand in df.columns:
                df = df.rename(columns={cand: "image_url"})
                break
    for std, cands in ALIASES.items():
        if std in df.columns:
            continue
        for cand in cands:
            if cand in df.columns:
                df = df.rename(columns={cand: std})
                break
    if "name" not in df.columns:
        for cand in ["品種名", "citrus_name", "item_name", "title"]:
            if cand in df.columns:
                df = df.rename(columns={cand: "name"})
                break
        if "name" not in df.columns:
            df["name"] = [f"item_{i}" for i in range(len(df))]
    if "id" not in df.columns:
        df["id"] = np.arange(1, len(df) + 1)
    return df

def load_data(path: str) -> pd.DataFrame:
    try:
        df = pd.read_csv(path, encoding="utf-8")
    except FileNotFoundError:
        raise FileNotFoundError(f"CSVが見つかりません: {path}")
    except UnicodeDecodeError:
        # 文字化け時のフォールバック
        df = pd.read_csv(path, encoding="cp932")
    df = _standardize_columns(df)
    missing = [c for c in FEATURES if c not in df.columns]
    if missing:
        raise KeyError(f"必要カラムが見つかりません: {missing} / 取得カラム: {list(df.columns)}")
    for col in FEATURES:
        df[col] = pd.to_numeric(df[col], errors="coerce").clip(1, 6)
    if "season" not in df.columns:
        df["season"] = ""
    df["season"] = df["season"].fillna("").astype(str)
    if "image_url" not in df.columns:
        df["image_url"] = ""
    else:
        df["image_url"] = df["image_url"].fillna("").astype(str)
    return df.dropna(subset=FEATURES)

def parse_seasons(cell: str) -> List[str]:
    if not cell:
        return []
    return [s.strip().lower() for s in str(cell).split(",") if s.strip()]

def score_items(
    df: pd.DataFrame,
    user_vec: np.ndarray,
    season_pref: str = "",
    weights: Dict[str, float] | None = None,
    season_boost: float = 0.03,
) -> pd.DataFrame:
    if len(user_vec) != len(FEATURES):
        raise ValueError(f"user_vec length must be {len(FEATURES)}")
    if weights is None:
        weights = {k: 1.0 for k in FEATURES}
    else:
        # 欠けているキーは1.0で補完し、数値化
        weights = {k: float(weights.get(k, 1.0)) for k in FEATURES}
    w = np.array([weights[k] for k in FEATURES], dtype=float)
    max_dist = math.sqrt(np.sum((w * 5) ** 2))
    X = df[FEATURES].to_numpy(dtype=float)
    diffs = X - user_vec[None, :]
    dists = np.sqrt(np.sum((diffs * w[None, :]) ** 2, axis=1))
    scores = 1.0 - (dists / max_dist)
    season_pref_norm = season_pref.strip().lower()
    add = np.zeros_like(scores)
    if season_pref_norm:
        match = df["season"].fillna("").map(
            lambda s: season_pref_norm in parse_seasons(s)
        ).to_numpy(dtype=bool)
        add = np.where(match, season_boost, 0.0)
    final = np.clip(scores + add, 0.0, 1.0)
    out = df.copy()
    out["distance"] = dists
    out["score"] = final
    return out.sort_values(["score", "name"], ascending=[False, True]).reset_index(drop=True)

# --- UI入力ヘルパー関数 ---

def map_sweetness_to_brix(sweetness_1_5: int) -> int:
    """甘さ(1〜5)を brix(1〜6) に線形マッピング"""
    return int(round(1 + (sweetness_1_5 - 1) * (5 / 4)))

TEXTURE_MAP = {
    "ジューシー": 4,
    "果肉がしっかり": 5,
    "なめらか": 3,
}

def make_user_vector(sweetness_1_5: int, texture_label: str | None = None) -> np.ndarray:
    """UI入力からユーザーベクトルを構築"""
    brix = map_sweetness_to_brix(sweetness_1_5)
    texture = TEXTURE_MAP.get(texture_label or "", 3)
    acid = 3
    bitterness = 3
    aroma = 3
    moisture = 4 if texture_label == "ジューシー" else 3
    return np.array([brix, acid, bitterness, aroma, moisture, texture], dtype=float)

