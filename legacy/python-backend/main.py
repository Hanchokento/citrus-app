# backend/main.py
import os
import json
import numpy as np
from typing import Optional, List, Tuple
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .recommend_core import load_data, score_items, FEATURES
import gspread
from google.oauth2.service_account import Credentials

load_dotenv()
here = os.path.dirname(__file__)
CSV_PATH = os.getenv("CSV_PATH") or os.path.join(here, "data", "citrus_features.csv")

app = FastAPI(title="Citrus Recommender API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RecommendRequest(BaseModel):
    brix: int = Field(ge=1, le=6)
    acid: int = Field(ge=1, le=6)
    bitterness: int = Field(ge=1, le=6)
    aroma: int = Field(ge=1, le=6)
    moisture: int = Field(ge=1, le=6)
    texture: int = Field(ge=1, le=6)
    season_pref: Optional[str] = ""
    topk: int = 5

class ItemOut(BaseModel):
    id: int
    name: str
    season: str
    image_url: str
    score: float
    distance: float

class RecommendResponse(BaseModel):
    items: List[ItemOut]

class LogRequest(BaseModel):
    result_names: List[str]
    user_agent: str
    brix: int
    acid: int
    bitterness: int
    aroma: int
    moisture: int
    texture: int
    topk: int
    location: Optional[str] = None
    season_pref: Optional[str] = None

def _load_sa_credentials() -> Tuple["gspread.Client", str]:
    SA_JSON = os.getenv("SERVICE_ACCOUNT_JSON", "").strip()
    SHEET_KEY = os.getenv("SHEET_KEY", "").strip()
    if not SA_JSON or not SHEET_KEY:
        raise RuntimeError("Missing SERVICE_ACCOUNT_JSON or SHEET_KEY")
    
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]
    try:
        if os.path.exists(SA_JSON):
            creds = Credentials.from_service_account_file(SA_JSON, scopes=scopes)
        else:
            info = json.loads(SA_JSON)
            creds = Credentials.from_service_account_info(info, scopes=scopes)
    except Exception as e:
        raise RuntimeError(f"Service account credential load failed: {e}")
    gc = gspread.authorize(creds)
    return gc, SHEET_KEY

def _summarize_ua(raw: str) -> str:
    if not raw:
        return ""
    s = raw.lower()
    if "windows" in s:
        os_name = "Windows"
    elif "mac os" in s or "macintosh" in s or "macos" in s:
        os_name = "macOS"
    elif "iphone" in s or "ipad" in s or "ios" in s:
        os_name = "iOS"
    elif "android" in s:
        os_name = "Android"
    else:
        os_name = "OtherOS"
    if "edg" in s:
        browser = "Edge"
    elif "chrome" in s and "chromium" not in s:
        browser = "Chrome"
    elif "safari" in s and "chrome" not in s:
        browser = "Safari"
    elif "firefox" in s:
        browser = "Firefox"
    else:
        browser = "OtherBrowser"
    if "mobile" in s or "iphone" in s or "android" in s:
        device = "Mobile"
    elif "ipad" in s or "tablet" in s:
        device = "Tablet"
    else:
        device = "PC"
    return f"{os_name} / {browser} / {device}"

try:
    DF = load_data(CSV_PATH)
except Exception as e:
    raise RuntimeError(f"CSV読み込み失敗: {CSV_PATH} / {e}")

@app.get("/health")
def health():
    return {"ok": True, "csv": CSV_PATH, "rows": len(DF), "features": FEATURES}

@app.post("/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest):
    try:
        user_vec = np.array(
            [req.brix, req.acid, req.bitterness, req.aroma, req.moisture, req.texture],
            dtype=float,
        )
        ranked = score_items(DF, user_vec, season_pref=(req.season_pref or "").lower())
        top = ranked.head(int(req.topk))
        items = [
            ItemOut(
                id=int(r["id"]),
                name=str(r["name"]),
                season=str(r.get("season", "")),
                image_url=str(r.get("image_url", "")),
                score=float(r["score"]),
                distance=float(r["distance"]),
            )
            for _, r in top.iterrows()
        ]
        return RecommendResponse(items=items)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/log")
def log(req: LogRequest, request: Request):
    try:
        gc, SHEET_KEY = _load_sa_credentials()
        sh = gc.open_by_key(SHEET_KEY)
        ws = sh.sheet1
        HEAD = [
            "timestamp","location","result_names","user_agent",
            "brix","acid","bitterness","aroma","moisture","texture",
            "season_pref","topk",
        ]
        current = ws.row_values(1)
        if current != HEAD:
            ws.clear()
            ws.update("A1", [HEAD])
        names = [str(x) for x in (req.result_names or [])]
        result_str = ", ".join(names)
        ua_short = _summarize_ua(req.user_agent or "")
        loc = req.location or ""
        row = [
            datetime.utcnow().isoformat(timespec="seconds"),
            loc,
            result_str,
            ua_short,
            req.brix,
            req.acid,
            req.bitterness,
            req.aroma,
            req.moisture,
            req.texture,
            (req.season_pref or ""),
            req.topk,
        ]
        ws.append_row(row, value_input_option="USER_ENTERED")
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"スプレッドシート書き込み失敗: {e}")
    
from starlette.staticfiles import StaticFiles

# すべての API ルート定義のあとに書く
app.mount("/", StaticFiles(directory="frontend", html=True), name="static")