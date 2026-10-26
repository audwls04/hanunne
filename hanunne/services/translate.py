"""
[AI 모델] 쉬운 말 번역 파이프라인

  사진 -> (1) 글자 읽기(OCR) -> (2) 어려운 단어 찾기 + 난이도 -> (3) 쉬운 말 번역·요약 -> (4) 숫자 검사
          EasyOCR + OpenCV             우리 단어장(규칙)                 Gemini + 단어장 용어집      규칙

- (1)은 EasyOCR, (3)은 Google Gemini API.
- Gemini API 키가 없으면 OCR 후 단어장 기반 오프라인 번역으로 대체.
- 모델을 처음부터 학습시키는 것이 아닌 기존 AI에 단어장을 '용어집'으로 주입해 번역하도록 함.
"""
import json
import os
import re

import requests
import cv2
import easyocr
import numpy as np
from io import BytesIO
from PIL import Image


API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

# 첫 요청 때만 OCR 모델을 초기화해 재사용
_OCR_READER = None


def get_ocr_reader():
    global _OCR_READER
    if _OCR_READER is None:
        _OCR_READER = easyocr.Reader(["ko", "en"], gpu=False)
    return _OCR_READER


def api_key():
    return os.environ.get("GEMINI_API_KEY", "").strip()


def model():
    return os.environ.get("GEMINI_MODEL", "gemini-3.8-flash").strip()



def find_hard_words(text, words_longest_first, limit=40):
    """원문에서 단어장에 있는 어려운 단어 찾기 (긴 단어 먼저, 겹치지 않게)"""
    hits, t = [], text
    for w in words_longest_first:
        if w["w"] in t:
            hits.append(w)
            t = t.replace(w["w"], "\0" * len(w["w"]))
            if len(hits) >= limit:
                break
    return hits


def difficulty(text, hits):
    """난이도 1(쉬움)~3(어려움): 100글자당 어려운 단어 수 + 평균 문장 길이"""
    chars = len(re.sub(r"\s", "", text)) or 1
    per100 = len(hits) / chars * 100
    sents = [s for s in re.split(r"[.!?。\n]+", text) if len(s.strip()) > 3]
    avg = sum(len(s) for s in sents) / len(sents) if sents else 0
    lv = 1 if per100 < 1 else 2 if per100 < 3 else 3
    if avg > 45 and lv < 3:
        lv += 1
    return {"lv": lv, "per100": round(per100, 1), "avg": round(avg)}


def number_check(orig, easy):
    """원문의 숫자(금액·날짜·전화번호)가 번역문에 그대로 있는지"""
    nums = {n.rstrip(",.") for n in re.findall(r"\d[\d,.\-~:]*\d|\d", orig)}
    nums = sorted(n for n in nums if len(n) >= 2)
    flat = re.sub(r"\s", "", easy)
    return {"total": len(nums), "miss": [n for n in nums if n not in flat]}


def offline_easy(text, hits):
    for w in hits:
        text = text.replace(w["w"], w["e"])
    return text


def related_policies(text, policies, my_sgg=None, limit=3):
    """원문에 정책 이름이 나오면 우리 데이터의 혜택과 연결"""
    flat = re.sub(r"\s", "", text)
    found = []
    for p in policies:
        name = re.sub(r"\s|\(.*?\)", "", p["n"])
        if len(name) >= 4 and name[:8] in flat:
            local = (my_sgg in p["sg"]) or any(g in flat for g in p["sg"])
            found.append((not local, p["id"]))
    return [pid for _, pid in sorted(found)[:limit]]


# Gemini 호출
class AIError(Exception):
    pass

def call_ai(parts, max_tokens=8192, json_mode=False):
    """Gemini 에게 parts(글·사진 조각 목록)를 보내고 답(글)을 돌려받기.
    parts 예: [{"text": "질문"}] 또는 [{"inline_data": {...사진...}}, {"text": "질문"}]"""
    if not api_key():
        raise AIError("no_key")
    config = {"maxOutputTokens": max_tokens, "temperature": 0.2}   # temperature 낮게 = 매번 비슷한 답
    if json_mode:
        config["responseMimeType"] = "application/json"            
    try:
        r = requests.post(
            API_URL.format(model=model()),
            headers={"x-goog-api-key": api_key(), "Content-Type": "application/json"},
            json={"contents": [{"role": "user", "parts": parts}], "generationConfig": config},
            timeout=90,
        )
    except requests.RequestException:
        raise AIError("network")
    if r.status_code == 429:
        raise AIError("rate_limited")             
    if r.status_code in (400, 401, 403) and "key" in r.text.lower():
        raise AIError("bad_key")                   
    if r.status_code != 200:
        raise AIError(f"api_{r.status_code}: {r.text[:200]}")
    data = r.json()
    cands = data.get("candidates") or []
    if not cands:                                  
        raise AIError("blocked")
    texts = [p.get("text", "") for p in cands[0].get("content", {}).get("parts", []) if not p.get("thought")]
    return "".join(texts)


def parse_json(text):
    """AI 답에서 JSON 부분만 꺼내기"""
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        raise AIError("bad_json")
    return json.loads(m.group(0))


def ocr(image_bytes, media_type=None):
    """이미지 바이트를 EasyOCR로 읽습니다. media_type은 기존 API 호환용 인자입니다."""
    try:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        img = np.asarray(image)
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        gray = cv2.resize(
            gray, None, fx=1.5, fy=1.5,
            interpolation=cv2.INTER_CUBIC,
        )
        results = get_ocr_reader().readtext(gray, detail=1)
        text = "\n".join(
            detected_text.strip()
            for _box, detected_text, _confidence in results
            if detected_text and detected_text.strip()
        )
    except Exception as exc:
        raise AIError("ocr_failed") from exc

    return text or None


TRANSLATE_PROMPT = """너는 어르신을 위한 '쉬운 말 번역기'야. 아래 [원문]을 70~80대 어르신이 한 번에 이해하도록 바꿔줘.
규칙:
1. 짧은 문장, 부드러운 존댓말(~해요). 한 문장에 한 가지 내용만.
2. 숫자·금액·날짜·기간·전화번호·기관 이름은 원문 그대로 옮겨. 절대 바꾸거나 빼지 마.
3. [용어집]에 있는 단어는 용어집의 쉬운 말을 써.
4. 원문에 없는 내용은 지어내지 마.
5. 해야 할 일(신청 방법, 준비물, 기한, 연락처)이 있으면 todo에 짧게 최대 4개.
6. 용어집에 없는데 어려운 단어가 있으면 extra에 최대 5개.

[용어집]
{glossary}

[원문]
{text}

오직 JSON 하나로만 답해: {{"easy":"쉬운 말 번역 전문","summary":"한 문장 요약","todo":["..."],"extra":[{{"word":"어려운 말","easy":"쉬운 말"}}]}}"""


def translate(store, text=None, image=None, media_type=None, my_sgg=None):
    """전체 파이프라인. 결과 dict 또는 {"error": ..., "title":..., "msg":...}"""
    # (1) 글자 읽기
    if image is not None:
        try:
            text = ocr(image, media_type)
        except AIError as e:
            return error_for(str(e), photo=True)
        if not text:
            return {"error": "unreadable"}
    text = (text or "").strip()[:6000]
    if not text:
        return {"error": "empty", "title": "글이 비어 있어요", "msg": "번역할 글을 넣어 주세요."}

    # (2) 어려운 단어 + 난이도 (규칙)
    hits = find_hard_words(text, store.words_longest_first)
    result = {
        "orig": text,
        "hits": [{"w": w["w"], "e": w["e"]} for w in hits],
        "diff": difficulty(text, hits),
        "related": related_policies(text, store.policies, my_sgg),
    }

    # (3) 쉬운 말 번역 (AI, 실패하면 단어장 번역)
    try:
        glossary = "\n".join(f"- {w['w']} → {w['e']}" for w in hits) or "(없음)"
        j = parse_json(call_ai([{"text": TRANSLATE_PROMPT.format(glossary=glossary, text=text)}], json_mode=True))
        result.update(
            easy=str(j.get("easy", "")), summary=str(j.get("summary", "")),
            todo=[str(t) for t in (j.get("todo") or [])][:4],
            extra=[x for x in (j.get("extra") or []) if isinstance(x, dict) and x.get("word")][:5],
            offline=False,
        )
        if not result["easy"].strip():
            raise AIError("empty")
    except AIError as e:
        result.update(easy=offline_easy(text, hits), summary="", todo=[], extra=[], offline=True,
                      notice=None if str(e) == "no_key" else "AI 번역이 안 돼서 단어장으로 바꿨어요")

    # (4) 숫자 검사 (규칙)
    result["numcheck"] = number_check(text, result["easy"])
    return result


def error_for(code, photo=False):
    if code == "ocr_failed":
        return {"error": code, "title": "사진을 읽을 수 없어요",
                "msg": "사진 파일을 확인하고 글자가 선명하게 보이도록 다시 촬영해 주세요."}
    if code == "no_key":
        return {"error": code, "title": "사진 번역을 쓸 수 없어요",
                "msg": "서버에 AI 키가 설정되지 않았어요. 글자 붙여넣기나 예시 안내문으로 시연해 주세요."}
    if code == "rate_limited":
        return {"error": code, "title": "잠시 후 다시 해주세요", "msg": "AI 사용량이 많아 지금은 번역할 수 없어요."}
    if code == "bad_key":
        return {"error": code, "title": "AI 키를 확인해 주세요",
                "msg": "서버의 Gemini API 키가 틀렸거나 사용할 수 없어요. 관리자에게 알려 주세요."}
    if code == "blocked":
        return {"error": code, "title": "이 사진은 번역할 수 없어요", "msg": "다른 사진으로 다시 해 주세요."}
    if code == "network":
        return {"error": code, "title": "인터넷이 연결되지 않았어요", "msg": "와이파이나 데이터를 확인하고 다시 눌러 주세요."}
    return {"error": code}


def explain_policy(store, p):
    """혜택 상세의 '더 쉬운 말로 풀어 듣기'"""
    src = "\n".join(x for x in [p["n"], p["d"], p["q"], p["how"], p["at"], p["todo"], p["t"]] if x)
    hits = find_hard_words(src, store.words_longest_first)
    try:
        text = call_ai([{"text":
            "어르신께 아래 복지 혜택을 손주가 설명하듯 3~4문장의 쉬운 존댓말로 설명해줘. 숫자·전화번호·날짜는 그대로. "
            "없는 내용은 지어내지 마. 설명 문장만 써.\n용어집:\n"
            + "\n".join(f"{w['w']} → {w['e']}" for w in hits) + "\n\n혜택 정보:\n" + src[:3000]}])
        return {"text": text.strip(), "offline": False}
    except AIError:
        return {"offline": True, "hits": [{"w": w["w"], "e": w["e"]} for w in hits[:8]]}