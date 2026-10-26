"""
  주소                    하는 일                         실제 코드
  GET  /                  앱 화면(HTML) 보내기            static/index.html
  GET  /api/data.js       혜택·단어 데이터                services/data_store.py
  GET  /api/status        AI 사용 가능 여부 + 시트 동기화 상태
  POST /api/recommend     맞춤 혜택 추천                  services/recommend.py
  POST /api/translate     사진/글 → 쉬운 말 번역           services/translate.py
  POST /api/explain       혜택 하나를 쉬운 말로 풀기       services/translate.py
"""
import json
import os

from flask import Flask, Response, jsonify, request, send_from_directory

from services import recommend as rec
from services.env import load_env
from services import sheet_sync
from services import translate as tr
from services.data_store import store

load_env()
app = Flask(__name__, static_folder="static", static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 12 * 1024 * 1024  # 사진 최대 12MB
sheet_sync.start_background()   # .env 에 구글 시트 주소가 있으면 몇 분마다 자동 동기화


@app.get("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.get("/sw.js")
def service_worker():
    r = send_from_directory(app.static_folder, "sw.js")
    r.headers["Cache-Control"] = "no-cache"
    return r


@app.get("/api/data.js")
def data_js():
    s = store.get()
    body = ("const POLICIES=" + json.dumps(s.policies, ensure_ascii=False) + ";\n"
            "const WORDS=" + json.dumps(s.words, ensure_ascii=False) + ";\n")
    return Response(body, mimetype="application/javascript", headers={"Cache-Control": "no-cache"})


@app.get("/api/status")
def status():
    s = store.get()
    return jsonify(ai=bool(tr.api_key()), policies=len(s.policies), words=len(s.words), sync=sheet_sync.last)


@app.post("/api/recommend")
def api_recommend():
    me = request.get_json(silent=True) or {}
    return jsonify(rec.recommend(store.get().policies, me))


@app.post("/api/translate")
def api_translate():
    s = store.get()
    if "image" in request.files:
        f = request.files["image"]
        result = tr.translate(s, image=f.read(), media_type=f.mimetype or "image/jpeg", my_sgg=request.form.get("sg"))
    else:
        body = request.get_json(silent=True) or {}
        result = tr.translate(s, text=body.get("text", ""), my_sgg=body.get("sg"))
    return jsonify(result)


@app.post("/api/explain")
def api_explain():
    s = store.get()
    p = s.by_id.get(int((request.get_json(silent=True) or {}).get("id", -1)))
    if not p:
        return jsonify(error="not_found"), 404
    return jsonify(tr.explain_policy(s, p))


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"한눈에 서버 시작 → http://localhost:{port}   (AI 키 {'있음' if tr.api_key() else '없음: 단어장 번역으로 동작'})")
    print(f"데이터: {'구글 시트 자동 동기화' if sheet_sync.enabled() else 'data/*.json 파일'}")
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("DEBUG") == "1")