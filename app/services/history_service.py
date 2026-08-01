import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from dataclasses import asdict

from app.models.download_history_entry import DownloadHistoryEntry

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_MAX_ENTRIES = 200


class HistoryService:

    HISTORY_FILE = _PROJECT_ROOT / "app" / "config" / "history.json"

    def __init__(self):
        self.HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)

    def load(self) -> list[DownloadHistoryEntry]:
        if not self.HISTORY_FILE.exists():
            return []
        try:
            raw = json.loads(self.HISTORY_FILE.read_text(encoding="utf-8"))
            return [DownloadHistoryEntry(**item) for item in raw]
        except (json.JSONDecodeError, TypeError, KeyError):
            return []

    def add(self, entry_data: dict) -> DownloadHistoryEntry:
        entries = self.load()
        entry = DownloadHistoryEntry(
            id=str(uuid.uuid4()),
            downloaded_at=datetime.now(timezone.utc).isoformat(),
            **entry_data,
        )
        entries.insert(0, entry)
        self._save(entries[:_MAX_ENTRIES])
        return entry

    def get_by_id(self, entry_id: str) -> DownloadHistoryEntry | None:
        return next((e for e in self.load() if e.id == entry_id), None)

    def _save(self, entries: list[DownloadHistoryEntry]) -> None:
        data = [asdict(entry) for entry in entries]
        self.HISTORY_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")