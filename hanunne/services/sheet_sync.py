import csv
import io
import json
import os
import threading
import time
from datetime import datetime
from pathlib import Path

import requests

from services import schema

DATA = Path(__file__).resolve().parent.parent / "data"

# 마지막 동기화 결과
last = {"ok": None, "time": None, "message": "아직 동기화 안 함", "warnings": []}


def urls():
    return os.environ.get("POLICIES_CSV_URL", "").strip(), os.environ.get("WORDS_CSV_URL", "").strip()


def enabled():
    p, w = urls()
    return bool(p and w)


def fetch_csv(url):
    """주소에서 CSV 를 받아 [ {열이름: 값}, ... ] 목록으로"""
    r = requests.get(url, timeout=20)
    r.raise_for_status()
    r.encoding = "utf-8"
    text = r.text.lstrip("﻿")          # 엑셀이 붙이는 BOM 문자 제거
    if text.lstrip().lower().startswith("<!doctype html") or "<html" in text[:200].lower():
        raise ValueError("CSV 가 아니라 웹페이지가 왔어요. '웹에 게시'에서 CSV 형식으로 게시했는지 확인하세요.")
    return list(csv.DictReader(io.StringIO(text)))


def check_headers(rows, columns, label):
    if not rows:
        raise ValueError(f"{label} 시트가 비어 있어요.")
    missing = [col for _, col in columns if col not in rows[0]]
    if missing:
        raise ValueError(f"{label} 시트 1행에 이 열이 없어요: {', '.join(missing)}")


def convert(policy_rows, word_rows):
    """시트 줄들 → (혜택 목록, 단어 목록, 경고 목록)"""
    warnings, policies, seen = [], [], set()
    for i, row in enumerate(policy_rows, start=2):
        if not any(str(v).strip() for v in row.values() if v):
            continue                                    
        try:
            p = schema.row_to_policy(row)
        except ValueError as e:
            warnings.append(f"혜택 {i}행 건너뜀: {e}")
            continue
        if p["id"] in seen:
            warnings.append(f"혜택 {i}행 건너뜀: 번호 {p['id']} 가 겹침")
            continue
        seen.add(p["id"])
        policies.append(p)

    words, seen_w = [], set()
    for i, row in enumerate(word_rows, start=2):
        if not any(str(v).strip() for v in row.values() if v):
            continue
        try:
            w = schema.row_to_word(row)
        except ValueError as e:
            warnings.append(f"단어 {i}행 건너뜀: {e}")
            continue
        if w["w"] in seen_w:
            continue                                   
        seen_w.add(w["w"])
        words.append(w)
    schema.fill_word_categories(words, policies)
    return policies, words, warnings


def write_json_safely(path, data):
    """임시 파일에 다 쓴 다음 한 번에 바꿔치기 → 쓰는 도중에 서버가 반쯤 쓴 파일을 읽는 일이 없음"""
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    os.replace(tmp, path)


def sync_once():
    """시트를 한 번 읽어서 JSON 갱신. 결과를 last 에 기록하고 돌려줌"""
    p_url, w_url = urls()
    try:
        p_rows, w_rows = fetch_csv(p_url), fetch_csv(w_url)
        check_headers(p_rows, schema.POLICY_COLUMNS, "혜택")
        check_headers(w_rows, schema.WORD_COLUMNS, "단어장")
        policies, words, warnings = convert(p_rows, w_rows)
        if not policies or not words:
            raise ValueError("읽은 혜택이나 단어가 0개예요. 시트를 확인하세요.")
        write_json_safely(DATA / "policies.json", policies)
        write_json_safely(DATA / "words.json", words)
        last.update(ok=True, message=f"혜택 {len(policies)}건, 단어 {len(words)}개 반영", warnings=warnings[:20])
    except Exception as e:                             
        last.update(ok=False, message=f"동기화 실패 (기존 데이터 유지): {e}", warnings=[])
    last["time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[시트 동기화] {last['time']} {last['message']}")
    for w in last["warnings"]:
        print("   -", w)
    return last


def start_background():
    """서버가 켜져 있는 동안 몇 분마다 sync_once() 를 실행하는 '스레드'(Java 의 Thread 와 같음)"""
    if not enabled():
        last["message"] = "시트 주소가 설정되지 않아 data/*.json 파일을 그대로 씀"
        return
    minutes = max(1, int(os.environ.get("SYNC_MINUTES", "5") or 5))

    def loop():
        while True:
            sync_once()
            time.sleep(minutes * 60)

    threading.Thread(target=loop, daemon=True).start()   # 서버가 꺼지면 같이 꺼짐