import json
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"


class DataStore:
    def __init__(self):
        self._mtime = None
        self.policies, self.words, self.by_id = [], [], {}

    def _load_if_changed(self):
        files = [DATA / "policies.json", DATA / "words.json"]
        mtime = tuple(f.stat().st_mtime for f in files)
        if mtime == self._mtime:
            return
        self.policies = json.loads(files[0].read_text(encoding="utf-8"))
        self.words = json.loads(files[1].read_text(encoding="utf-8"))
        self.by_id = {p["id"]: p for p in self.policies}
        self.words_longest_first = sorted((w for w in self.words if len(w["w"]) >= 2), key=lambda w: -len(w["w"]))
        self._mtime = mtime

    def get(self):
        self._load_if_changed()
        return self


store = DataStore()