# 실행:  python scripts/sync_sheet.py

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from services.env import load_env  # noqa: E402  (.env 읽기)
from services import sheet_sync  # noqa: E402

load_env()
if not sheet_sync.enabled():
    print(".env 에 POLICIES_CSV_URL, WORDS_CSV_URL 을 먼저 넣으세요.")
else:
    result = sheet_sync.sync_once()
    sys.exit(0 if result["ok"] else 1)
