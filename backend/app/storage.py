from __future__ import annotations
from pathlib import Path
from datetime import datetime
import json
from typing import Dict, List

HISTORY_DIR = Path.cwd() / "spectra_history"
HISTORY_DIR.mkdir(parents=True, exist_ok=True)

def save_json(name: str, data: Dict, meta: Dict) -> Path:
    meta2 = dict(meta)
    meta2.setdefault("name", name)
    meta2.setdefault("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    payload = {"meta": meta2, "data": data}
    out = HISTORY_DIR / f"{name}.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return out

def list_history() -> List[dict]:
    items: List[dict] = []
    for p in sorted(HISTORY_DIR.glob("*.json")):
        try:
            with open(p, "r", encoding="utf-8") as f:
                obj = json.load(f)
            meta = obj.get("meta", {})
            items.append({
                "name": meta.get("name") or p.stem,
                "file": p.name,
                "timestamp": meta.get("timestamp", "")
            })
        except Exception:
            items.append({"name": p.stem, "file": p.name, "timestamp": ""})
    return items

def load_json(name_or_file: str) -> dict:
    p = Path(name_or_file)
    if not p.suffix:
        p = HISTORY_DIR / f"{name_or_file}.json"
    elif not p.is_absolute():
        p = HISTORY_DIR / p.name
    if not p.exists():
        raise FileNotFoundError(p)
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)
