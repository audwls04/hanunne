"""
[AI 모델] 맞춤 혜택 추천 알고리즘

입력: 사용자 정보 me = {"g": "여"|"남"|None, "y": 1951, "m": 3, "d": 2, "sd": "경기도", "sg": "부천시"}
출력: 점수 높은 순 혜택 목록 + 추천 이유

1단계  자격 필터   — 받을 수 없는 혜택은 뺀다 (성별, 만 나이, 사는 곳, 신청 마감)
2단계  점수 매기기 — 더 딱 맞는 혜택일수록 위로 (지역 구체성, 나이 조건, 정보 충실도, 마감 임박)
3단계  다양성 정렬 — 같은 분야가 위쪽에 몰리지 않게 섞기
"""

import re
from datetime import date, datetime

SCORE = {
    "sgg_match": 30,      # 우리 동네(시·군·구) 혜택
    "sido_all": 20,       # 시·도 전체 혜택
    "nationwide": 10,     # 전국 공통
    "gender_only": 6,     # 성별 맞춤(여성/남성만 대상)
    "age_known": 8,       # 나이 조건이 분명하고 해당됨
    "age_high": 6,        # 75세 이상처럼 고령 대상이라 딱 맞음
    "closing_soon": 5,    # 45일 안에 마감
    "always_open": 2,     # 상시 신청
    "has_desc": 5,        # 지원내용이 적혀 있음
    "has_tel": 3,         # 문의전화가 있음
    "age_unknown": -3,    # 나이 조건 정보 없음
    "same_cat_penalty": 4,  # 다양성: 같은 분야가 이미 나온 만큼 감점
}


def man_age(y, m=None, d=None, today=None):
    """만 나이"""
    if not y:
        return None
    today = today or date.today()
    a = today.year - int(y)
    if (today.month, today.day) < (int(m or 1), int(d or 1)):
        a -= 1
    return a


def end_date(period):
    """'2026.02.11~2026.03.31' → datetime(2026,3,31).  끝 날짜가 없으면 None"""
    mt = re.search(r"~\s*(\d{4})\.\s*(\d{1,2})(?:\.\s*(\d{1,2}))?", period or "")
    if not mt:
        return None
    y, mo, d = int(mt.group(1)), int(mt.group(2)), int(mt.group(3) or 28)
    try:
        return datetime(y, mo, d, 23, 59)
    except ValueError:
        return None


def score_policy(p, me, age, now):
    """혜택 1건 → (점수, 추천 이유 목록).  받을 수 없으면 None"""
    why, s = [], 0
    g = me.get("g")

    # 1단계: 자격 필터
    if g == "남" and not p["m"]:
        return None
    if g == "여" and not p["f"]:
        return None
    if g and not (p["m"] and p["f"]):
        why.append("여성 대상" if g == "여" else "남성 대상")
        s += SCORE["gender_only"]

    if age is not None:
        if p["a0"] is not None and age < p["a0"]:
            return None
        if p["a1"] is not None and age > p["a1"]:
            return None
        if p["a0"] is not None:
            s += SCORE["age_known"]
            if p["a0"] >= 75:
                s += SCORE["age_high"]
                why.append(f"{p['a0']}세 이상 (딱 맞음)")
            else:
                why.append(f"{p['a0']}세 이상")

    sd, sg = me.get("sd"), me.get("sg")
    if sd:
        if not p["sd"]:
            s += SCORE["nationwide"]
            why.append("전국 공통")
        elif p["sd"] != sd:
            return None
        elif not p["sg"]:
            s += SCORE["sido_all"]
            why.append(re.sub("특별시|광역시", "", sd) + " 전체")
        elif sg and sg in p["sg"]:
            s += SCORE["sgg_match"]
            why.append("우리 동네 " + sg)
        else:
            return None

    e = end_date(p["t"])
    if e and e < now:
        return "closed"

    # 2단계: 점수
    if e and (e - now).days < 45:
        s += SCORE["closing_soon"]
        why.append("곧 마감")
    if re.search("상시|연중", p["t"]):
        s += SCORE["always_open"]
    if p["d"]:
        s += SCORE["has_desc"]
    if p["tel"]:
        s += SCORE["has_tel"]
    if p["a0"] is None and age is not None:
        s += SCORE["age_unknown"]
        why.append("나이 조건 확인")
    return s, why


def recommend(policies, me, now=None):
    now = now or datetime.now()
    age = man_age(me.get("y"), me.get("m"), me.get("d"), now.date())
    scored, closed = [], 0
    for p in policies:
        r = score_policy(p, me, age, now)
        if r is None:
            continue
        if r == "closed":
            closed += 1
            continue
        scored.append({"p": p, "score": r[0], "why": r[1]})
    scored.sort(key=lambda x: -x["score"])

    # 3단계: 다양성 정렬 (상위 12개 후보 중 '점수 - 같은 분야 감점'이 가장 큰 것을 차례로 뽑기)
    result, cnt, pool = [], {}, scored[:]
    while pool:
        window = pool[:12]
        best = max(window, key=lambda x: x["score"] - cnt.get(x["p"]["c"], 0) * SCORE["same_cat_penalty"])
        pool.remove(best)
        cnt[best["p"]["c"]] = cnt.get(best["p"]["c"], 0) + 1
        result.append(best)

    return {
        "age": age,
        "closed": closed,
        "list": [{"id": x["p"]["id"], "score": x["score"], "why": x["why"]} for x in result],
    }