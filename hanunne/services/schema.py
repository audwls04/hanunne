# (앱 내부 키, 시트의 한글 열 이름)
POLICY_COLUMNS = [
    ("id",   "번호"),
    ("c",    "분야"),        # 복지 / 보건 / 교통 / 행정 / 기타
    ("n",    "정책명"),
    ("d",    "지원내용"),
    ("m",    "남성대상"),
    ("f",    "여성대상"),
    ("a0",   "최소나이"),
    ("a1",   "최대나이"),
    ("sd",   "시도"),
    ("sg",   "시군구"),
    ("q",    "자격조건"),
    ("t",    "신청기간"),    # 상시 / 2026.02.11~2026.03.31
    ("todo", "해야할일"),
    ("how",  "신청방법"),
    ("at",   "신청장소"),
    ("org",  "담당기관"),
    ("tel",  "문의전화"),
    ("u",    "URL"),
]

WORD_COLUMNS = [
    ("w", "어려운단어"),
    ("e", "쉬운말"),
    ("c", "분야"),           # 빈칸이면 관련 혜택의 분야로 자동 채움
    ("p", "관련혜택번호"),   # 쉼표로 여러 개
]

CATEGORIES = {"복지", "보건", "교통", "행정", "기타"}


def _text(v):
    return "" if v is None else str(v).strip()


def _int_or_none(v):
    """'65', '65.0', '만 65세' → 65 / 빈칸 → None"""
    s = _text(v)
    digits = "".join(ch if ch.isdigit() else " " for ch in s).split()
    return int(digits[0]) if digits else None


def _yes(v, default=True):
    """O, TRUE, 해당, Y → True / X, FALSE → False / 빈칸 → default"""
    s = _text(v).upper()
    if s == "":
        return default
    return s in ("O", "○", "TRUE", "Y", "YES", "1", "해당", "남녀")


def _split(v):
    return [x.strip() for x in _text(v).replace("，", ",").split(",") if x.strip()]



def row_to_policy(row):
    """시트의 한 줄 {'번호': '1', '정책명': ...} → 앱 형식 {'id': 1, 'n': ...}
    문제가 있으면 ValueError 를 일으켜서, 부르는 쪽이 그 줄만 건너뛰게 합니다."""
    get = lambda col: row.get(col, "")
    pid = _int_or_none(get("번호"))
    name = _text(get("정책명"))
    if pid is None or not name:
        raise ValueError("번호나 정책명이 비어 있음")
    cat = _text(get("분야")) or "기타"
    if cat not in CATEGORIES:
        cat = "기타"
    sd = _text(get("시도"))
    sg = _split(get("시군구"))
    if sg in (["전체"], ["전국"]):  # 전체 -> 전국
        sg = []
    return {
        "id": pid, "c": cat, "n": name, "d": _text(get("지원내용")),
        "m": _yes(get("남성대상")), "f": _yes(get("여성대상")),
        "a0": _int_or_none(get("최소나이")), "a1": _int_or_none(get("최대나이")),
        "sd": "" if sd in ("전국", "전체") else sd, "sg": sg,
        "q": _text(get("자격조건")), "t": _text(get("신청기간")), "todo": _text(get("해야할일")),
        "how": _text(get("신청방법")), "at": _text(get("신청장소")), "org": _text(get("담당기관")),
        "tel": _text(get("문의전화")), "u": _text(get("URL")),
    }


def policy_to_row(p):
    """앱 형식 → 시트 한 줄 (처음에 시트를 만들 때 CSV 로 내보내는 용도)"""
    out = {}
    for key, col in POLICY_COLUMNS:
        v = p[key]
        if key in ("m", "f"):
            v = "O" if v else "X"
        elif key == "sg":
            v = ",".join(v)
        elif v is None:
            v = ""
        out[col] = v
    return out


def row_to_word(row):
    w, e = _text(row.get("어려운단어")), _text(row.get("쉬운말"))
    if not w or not e:
        raise ValueError("어려운단어나 쉬운말이 비어 있음")
    return {"w": w, "e": e, "c": _text(row.get("분야")),
            "p": [int(x) for x in _split(row.get("관련혜택번호")) if x.isdigit()]}


def word_to_row(w):
    return {"어려운단어": w["w"], "쉬운말": w["e"], "분야": w["c"], "관련혜택번호": ",".join(map(str, w["p"]))}


def fill_word_categories(words, policies):
    """단어의 분야가 비어 있으면, 그 단어가 나온 혜택들 중 가장 많은 분야로 채움"""
    from collections import Counter
    by_id = {p["id"]: p for p in policies}
    for w in words:
        if not w["c"]:
            cats = Counter(by_id[i]["c"] for i in w["p"] if i in by_id)
            w["c"] = cats.most_common(1)[0][0] if cats else "기타"
    return words