(function(){
const $app=document.getElementById('app');
const TODAY=new Date();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,d){try{const v=localStorage.getItem('hn_'+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem('hn_'+k,JSON.stringify(v))}catch(e){}}};

// 아이콘
const IC={
 heart:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.2C.8 8.3 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 6 3.8 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg>',
 plus:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/></svg>',
 bus:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3h14a2 2 0 0 1 2 2v11a2 2 0 0 1-1 1.7V20a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-2H7v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2.3A2 2 0 0 1 3 16V5a2 2 0 0 1 2-2zm0 3v5h14V6zm2 8a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm10 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>',
 doc:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V9h5.5zM7 12v2h10v-2zm0 4v2h7v-2z"/></svg>',
 star:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z"/></svg>',
 cam:'<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3h6l1.5 2H20a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3.5zm3 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6z"/></svg>',
 search:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21" stroke-linecap="round"/></svg>',
 book:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4a2 2 0 0 1 2-2h13v16H6a1 1 0 0 0 0 2h13v2H6a3 3 0 0 1-3-3V4zm4 2v2h8V6z"/></svg>',
 sound:'<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M4 9h4l5-4v14l-5-4H4zm12.5-1.5a6 6 0 0 1 0 9l-1.4-1.4a4 4 0 0 0 0-6.2zM18.9 5a9.5 9.5 0 0 1 0 14l-1.4-1.4a7.5 7.5 0 0 0 0-11.2z"/></svg>',
 wifi:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1.2" fill="currentColor"/><path d="M3 3l18 18"/></svg>',
};
const CAT_IC={'복지':IC.heart,'보건':IC.plus,'교통':IC.bus,'행정':IC.doc,'기타':IC.star};
const LOGO='<svg width="96" height="80" viewBox="0 0 96 80" aria-hidden="true"><rect x="8" y="10" width="54" height="62" rx="10" fill="#DCE7FF"/><rect x="16" y="22" width="30" height="5" rx="2.5" fill="#9DB6F5"/><rect x="16" y="33" width="22" height="5" rx="2.5" fill="#9DB6F5"/><rect x="16" y="44" width="26" height="5" rx="2.5" fill="#9DB6F5"/><circle cx="60" cy="40" r="20" fill="#fff" stroke="#141C3D" stroke-width="7"/><circle cx="60" cy="40" r="7" fill="#2F66F0"/><circle cx="63" cy="37" r="2.4" fill="#fff"/><path d="M74 54l12 12" stroke="#141C3D" stroke-width="9" stroke-linecap="round"/><path d="M78 10l4-6M84 16l7-3M86 25h7" stroke="#FFC93C" stroke-width="4" stroke-linecap="round"/></svg>';

// 데이터 준비
const POL=Object.fromEntries(POLICIES.map(p=>[p.id,p]));
const WSORT=WORDS.filter(w=>w.w.length>=2).sort((a,b)=>b.w.length-a.w.length);
const SIDO={};POLICIES.forEach(p=>{if(!p.sd||p.sd==='충청북도')return;(SIDO[p.sd]=SIDO[p.sd]||new Set());p.sg.forEach(g=>SIDO[p.sd].add(g))});
const SIDO_LIST=Object.keys(SIDO).sort();
function endDate(t){ // "2026.02.11~2026.03.31" → Date
  const m=String(t||'').match(/~\s*(\d{4})\.\s*(\d{1,2})(?:\.\s*(\d{1,2}))?/); if(!m)return null;
  return new Date(+m[1],+m[2]-1,m[3]?+m[3]:28,23,59);
}
function manAge(y,m,d){ if(!y)return null; let a=TODAY.getFullYear()-y; const mm=m||1,dd=d||1; if(TODAY.getMonth()+1<mm||(TODAY.getMonth()+1===mm&&TODAY.getDate()<dd))a--; return a; }

/* ---------- 맞춤 추천 알고리즘 ----------
   1단계 자격 필터: 성별 · 만 나이(최소/최대) · 사는 곳(전국 / 시·도 전체 / 시·군·구)
   2단계 점수: 지역 구체성 + 나이 조건 명확성 + 정보 충실도 + 마감 임박
   3단계 다양성 재정렬: 같은 분야가 위쪽에 몰리지 않게 */
function recommendLocal(me){ // 오프라인 예비용
  const age=manAge(me.y,me.m,me.d); const out=[]; let closed=0;
  for(const p of POLICIES){
    const why=[]; let s=0;
    if(me.g==='남'&&!p.m)continue; if(me.g==='여'&&!p.f)continue;
    if(me.g&&!(p.m&&p.f)){why.push(me.g==='여'?'여성 대상':'남성 대상');s+=6}
    if(age!=null){ if(p.a0!=null&&age<p.a0)continue; if(p.a1!=null&&age>p.a1)continue;
      if(p.a0!=null){why.push(p.a0+'세 이상');s+=8; if(p.a0>=75){s+=6;why[why.length-1]=p.a0+'세 이상 (딱 맞음)'}} }
    if(me.sd){
      if(!p.sd){s+=10;why.push('전국 공통')}
      else if(p.sd!==me.sd)continue;
      else if(!p.sg.length){s+=20;why.push(me.sd.replace(/특별시|광역시/,'')+' 전체')}
      else if(me.sg&&p.sg.includes(me.sg)){s+=30;why.push('우리 동네 '+me.sg)}
      else continue;
    }
    const e=endDate(p.t);
    if(e&&e<TODAY){closed++;continue}
    if(e){const left=(e-TODAY)/864e5; if(left<45){s+=5;why.push('곧 마감')}}
    if(/상시|연중/.test(p.t))s+=2;
    if(p.d)s+=5; if(p.tel)s+=3; if(p.a0==null&&age!=null){s-=3;why.push('나이 조건 확인')}
    out.push({p,s,why});
  }
  out.sort((a,b)=>b.s-a.s);
  const res=[],cnt={};
  const pool=out.slice();
  while(pool.length){ let bi=0,bs=-1e9; for(let i=0;i<Math.min(pool.length,12);i++){const c=pool[i];const v=c.s-(cnt[c.p.c]||0)*4; if(v>bs){bs=v;bi=i}} const c=pool.splice(bi,1)[0]; cnt[c.p.c]=(cnt[c.p.c]||0)+1; res.push(c); }
  return {list:res,closed,age};
}

// 쉬운말 번역 파이프라인
function findHard(text){
  const hits=[];let t=text;
  for(const w of WSORT){ if(t.includes(w.w)){hits.push(w); t=t.split(w.w).join('\u0000'.repeat(w.w.length));} if(hits.length>=40)break; }
  return hits;
}
function difficulty(text,hits){
  const chars=text.replace(/\s/g,'').length||1; const per100=hits.length/chars*100;
  const sents=text.split(/[.!?。\n]+/).filter(s=>s.trim().length>3); const avg=sents.length?sents.reduce((a,s)=>a+s.length,0)/sents.length:0;
  let lv=per100<1?1:per100<3?2:3; if(avg>45&&lv<3)lv++; return {lv,per100:+per100.toFixed(1),avg:Math.round(avg)};
}
function numbers(t){return (String(t).match(/\d[\d,.\-~:]*\d|\d/g)||[]).map(x=>x.replace(/[,.]$/,''))}
function numberCheck(orig,easy){const a=[...new Set(numbers(orig).filter(n=>n.length>=2))];const miss=a.filter(n=>!String(easy).replace(/\s/g,'').includes(n.replace(/\s/g,'')));return {total:a.length,miss}}
function offlineEasy(text,hits){let t=text;for(const w of hits)t=t.split(w.w).join(w.e);return t}

// 파이썬 서버와 대화하는 함수
async function api(path,body,isForm){
  const opt=body===undefined?{}:{method:'POST',body:isForm?body:JSON.stringify(body),headers:isForm?{}:{'Content-Type':'application/json'}};
  const r=await fetch(path,opt); if(!r.ok)throw {code:'http_'+r.status}; return r.json();
}
let AI_ON=null; const statusP=api('/api/status').then(s=>{AI_ON=s.ai;return s}).catch(()=>{AI_ON=false;return null});
// 사진을 1600px 이하 JPEG로 줄여서 보내기
async function shrink(file){
  try{const bmp=await createImageBitmap(file);const k=Math.min(1,1600/Math.max(bmp.width,bmp.height));
    const c=document.createElement('canvas');c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);
    c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
    return await new Promise(r=>c.toBlob(b=>r(b||file),'image/jpeg',.85));}catch(e){return file}
}

const EXAMPLE=`[부천시 지역사회 통합 돌봄 안내]
살던 곳에서 건강한 생활을 지속할 수 있도록 보건의료, 요양돌봄, 주거돌봄, 생활돌봄 등 필요한 서비스를 통합지원합니다.
○ 대상: 65세 이상 어르신 및 65세 미만 심한 장애인 (돌봄대상자 주민등록 주소지가 부천시여야 함)
○ 신청기간: 상시
○ 제출서류: 통합지원 신청서 및 개인정보제공동의서
○ 신청장소: 구청 사회(가정)복지과 돌봄지원팀, 일반동 복지팀
○ 문의: 부천시청 돌봄지원과 032-625-9012`;


// S.screen = 지금 화면 이름(V.xxx) / S.stack = 뒤로가기 기록 / ME = 내 정보
let S={screen:'home',stack:[]};
let ME=store.get('me',null);
const TR={};
function go(screen,params){S.stack.push({screen:S.screen,params:S.params});S.screen=screen;S.params=params||{};render();}
function back(){const p=S.stack.pop();if(!p){S.screen='home';S.params={}}else{S.screen=p.screen;S.params=p.params}render();}
function home(){S.stack=[];S.screen='home';S.params={};render();}
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.getElementById('phone').appendChild(t);setTimeout(()=>t.remove(),2200)}
function top(title,noBack){return `<div class="top"><div class="tl">${noBack?'':'<button class="back" data-a="back">← 뒤로</button>'}</div><span class="ttl">${esc(title||'')}</span><div></div></div>`}
function speak(text){try{const u=new SpeechSynthesisUtterance(text);u.lang='ko-KR';u.rate=.9;speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){toast('이 기기에서는 소리로 듣기가 안 돼요')}}
const canSpeak=typeof speechSynthesis!=='undefined';



// 화면
const V={};
// 번역하기 / 한눈에 찾기 / 단어사전 3개 버튼
V.home=()=>`${top('',true)}<div class="scr center" style="gap:22px">
  ${LOGO}<div><p class="logo-t">한눈에</p><p class="logo-s">어려운 말도, 한눈에 쉽게</p></div>
  <div style="display:grid;gap:14px;width:100%;max-width:300px">
   <button class="home-btn" style="background:var(--sky);color:var(--navy)" data-a="go" data-s="tr_start">${IC.cam} 번역하기</button>
   <button class="home-btn" style="background:var(--navy);color:#fff" data-a="find">${IC.search} 한눈에 찾기</button>
   <button class="home-btn" style="background:var(--card);color:var(--navy);border:2px solid var(--navy)" data-a="go" data-s="dict">${IC.book} 단어사전</button>
  </div>
  <p class="sub" style="font-size:14px">${ME?`${esc(ME.sg||ME.sd||'')} ${ME.y?manAge(ME.y,ME.m,ME.d)+'세':''} ${ME.g?esc(ME.g)+'성':''} 기준으로 찾아 드려요`:'처음이시면 한눈에 찾기에서 3가지만 알려 주세요'}</p>
</div>`;


// 번역하기 — 사진 찍기 / 앨범 / 예시 안내문 / 글자 붙여넣기
V.tr_start=()=>`${top('번역하기')}<div class="scr">
  <p class="h1" style="text-align:center">말이 닿는 순간,<br>마음도 가까워져요</p>
  <div class="drop">
    <div class="hero-ic">${IC.cam}</div><b style="font-size:19px">사진을 올려주세요</b>
    <label class="btn" style="background:var(--blue)" for="f-cam">${IC.cam} 사진 찍기</label>
    <input id="f-cam" type="file" accept="image/*" capture="environment" hidden>
    <label class="btn alt" for="f-alb">앨범에서 고르기</label>
    <input id="f-alb" type="file" accept="image/*" hidden>
  </div>
  <div class="hint"><span class="bang">!</span><span>글자가 잘 보이도록 정면에서 촬영해주세요</span></div>
  <button class="btn soft sm" data-a="example">예시 안내문으로 해보기</button>
  <button class="link" data-a="go" data-s="tr_text">글자를 직접 붙여넣을래요</button>
  <p class="ai-note" id="ai-state"></p>
</div>`;
V.tr_text=()=>`${top('글자로 번역하기')}<div class="scr">
  <p class="h1" style="font-size:22px">어려운 글을 붙여넣어 주세요</p>
  <textarea id="t-in" placeholder="예) 기초연금 수급자 중 소득인정액이 선정기준액 이하인 경우…"></textarea>
  <button class="btn" data-a="trtext">쉬운 말로 바꾸기</button>
</div>`;


// 번역하기 -> 로딩 (글자읽기->단어찾기->쉬운말)
V.tr_load=()=>{const st=TR.step||0;const L=['사진 속 글자 읽기','어려운 단어 찾기','쉬운 말로 바꾸기'];return `${top('')}<div class="scr center" style="gap:20px">
  <div class="spin" role="status" aria-label="확인 중"></div>
  <div><p class="h1" style="font-size:22px">사진을 확인하고 있어요</p><p class="sub">잠시만 기다려 주세요…</p></div>
  <div class="steps">${L.map((l,i)=>`<div class="${i<st?'done':i===st?'on':''}">${i<st?'✓':i===st?'●':'○'} ${l}${i===st&&TR.stream?` <small>(${TR.stream}자)</small>`:''}</div>`).join('')}</div>
  <button class="link" data-a="cancel">그만하기</button></div>`};


// 번역하기 -> 오류(사진 인색 실패, AI 꺼짐, 인터넷 끊김 등)
V.tr_err=()=>`${top('')}<div class="scr center" style="gap:16px">
  <div class="hero-ic" style="background:#FDE3E3;color:var(--red);font-size:34px;font-weight:900">!</div>
  <p class="h1" style="font-size:23px">${esc(S.params.title||'사진을 인식할 수 없어요')}</p>
  <p class="sub">${esc(S.params.msg||'사진이 흐리면 정확한 번역이 어려울 수 있어요. 밝은 곳에서 촬영해주세요.')}</p></div>
  <div class="foot"><label class="btn" for="f-cam2">다시 촬영하기</label><input id="f-cam2" type="file" accept="image/*" capture="environment" hidden>
  <label class="btn alt" for="f-alb2">다른 사진 선택</label><input id="f-alb2" type="file" accept="image/*" hidden></div>`;


// 번역하기 -> 결과(쉬운 말 번역, 요약, 해야할 일, 어려운 단어, 관련 혜택, 원문)
function hl(text,hits){let h=esc(text);const ws=[...hits].sort((a,b)=>b.w.length-a.w.length);for(const w of ws){const e=esc(w.w);h=h.split(e).join('\u0001'+ws.indexOf(w)+'\u0002')}return h.replace(/\u0001(\d+)\u0002/g,(m,i)=>`<mark class="hw" data-a="word" data-w="${esc(ws[i].w)}">${esc(ws[i].w)}</mark>`)}
V.tr_res=()=>{const r=TR.res;const lvT=['','쉬움','보통','어려움'];const nc=r.numcheck||numberCheck(r.orig,r.easy);return `${top('번역 결과')}<div class="scr">
  <div class="meta"><span class="lvl l${r.diff.lv}">원문 난이도: ${lvT[r.diff.lv]}</span><span class="chip">어려운 단어 ${r.hits.length}개</span>${r.offline?'<span class="chip warn">단어장 번역</span>':'<span class="chip">AI 번역</span>'}${nc.total?(nc.miss.length?`<span class="chip red">숫자 ${nc.miss.length}개 확인 필요</span>`:'<span class="chip" style="background:#DDF3E8;color:var(--green)">숫자 그대로 ✓</span>'):''}</div>
  ${r.summary?`<div class="card" style="background:var(--navy);color:#fff;border:0"><small style="opacity:.75;font-size:13px">한 줄 요약</small><p style="margin:2px 0 0;font-size:19px;font-weight:700">${esc(r.summary)}</p></div>`:''}
  <div class="box easy"><h3>쉬운 말로 번역했어요!${canSpeak?`<button class="pill-btn" style="margin-left:auto;display:flex;gap:4px;align-items:center" data-a="speak">${IC.sound} 듣기</button>`:''}</h3><p>${esc(r.easy)}</p></div>
  ${r.todo&&r.todo.length?`<div class="card"><h4 style="margin:0 0 8px;color:var(--blue)">해야 할 일</h4><ul class="todo">${r.todo.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>`:''}
  ${r.hits.length||r.extra.length?`<div class="card"><h4 style="margin:0 0 8px;color:var(--blue)">어려운 단어 풀이</h4><div class="wchips">${r.hits.slice(0,12).map(w=>`<button data-a="word" data-w="${esc(w.w)}"><b>${esc(w.w)}</b><span>${esc(w.e)}</span></button>`).join('')}${r.extra.map(w=>`<button disabled style="opacity:1;border-style:dashed"><b>${esc(w.word)}</b><span>${esc(w.easy)}</span></button>`).join('')}</div>${r.extra.length?'<p class="ai-note" style="text-align:left;margin:8px 0 0">점선은 단어장에 없어 AI가 풀이한 단어예요 → 단어장 추가 후보</p>':''}</div>`:''}
  ${r.related.length?`<div class="card"><h4 style="margin:0 0 8px;color:var(--blue)">이 글과 관련된 혜택</h4><div class="list">${r.related.map(p=>item(p,[])).join('')}</div></div>`:''}
  <div class="box orig"><h3>${IC.doc} 원문</h3><p>${hl(r.orig,r.hits)}</p></div>
  ${nc.miss.length?`<p class="ai-note" style="text-align:left">번역문에 없는 원문 숫자: ${nc.miss.map(esc).join(', ')} — 원문을 꼭 함께 확인하세요.</p>`:''}
</div><div class="foot"><div class="row"><button class="btn alt sm" data-a="home">처음으로</button><button class="btn sm" data-a="go" data-s="tr_start">다시 번역하기</button></div></div>`};

let ctl=null;
async function runTranslate({file,text}){
  ctl=new AbortController(); const myCtl=ctl;
  TR.step=0;TR.stream=0; S.stack.push({screen:'tr_start',params:{}}); S.screen='tr_load'; render();
  const tick=setInterval(()=>{if(S.screen==='tr_load'&&TR.step<2){TR.step++;render()}},file?2500:900);
  try{
    let res;
    if(file){const fd=new FormData();fd.append('image',await shrink(file),'photo.jpg');if(ME&&ME.sg)fd.append('sg',ME.sg);res=await api('/api/translate',fd,true)}
    else res=await api('/api/translate',{text,sg:ME&&ME.sg});
    if(myCtl.signal.aborted)return;
    if(res.error)return fail(res.title,res.msg);
    if(res.notice)toast(res.notice);
    const W=Object.fromEntries(WORDS.map(w=>[w.w,w]));
    TR.res={...res,hits:res.hits.map(h=>W[h.w]||h),related:res.related.map(id=>POL[id]).filter(Boolean)};
    S.screen='tr_res';render();
  }catch(e){
    if(myCtl.signal.aborted)return;
    fail('인터넷이 연결되지 않았어요','와이파이나 데이터를 확인하고 다시 눌러 주세요.');
  }finally{clearInterval(tick)}
}
function fail(title,msg){S.screen='tr_err';S.params={title,msg};render()}

// 온보딩
let OB={};
// 시작 안내 -> 내 정보 3가지 입력 안내
V.ob0=()=>`${top('')}<div class="scr center" style="gap:24px">${LOGO}<p class="logo-t" style="font-size:28px">한눈에</p>
  <p class="h1" style="font-size:24px">딱 맞는 정보를 드리려고<br>3가지만 여쭤볼게요</p>
  <p class="sub" style="font-size:15px">입력한 정보는 이 휴대폰에만 저장되고<br>혜택을 찾는 데만 써요</p>
  <button class="btn" style="max-width:280px" data-a="ob" data-n="1">시작하기</button></div>
  <div class="foot" style="border:0;align-items:center"><button class="link" data-a="obskip">나중에 할게요</button></div>`;
const dots=n=>`<div class="dots">${[1,2,3].map(i=>`<i class="${i===n?'on':''}"></i>`).join('')}</div>`;

// 1-성별
V.ob1=()=>`${top('')}<div class="scr center" style="gap:26px"><p class="h1"><em>성별</em>에 맞는 건강검진<br>안내를 보여 드려요</p>
  <div class="choice">${['여','남'].map(g=>`<button aria-pressed="${OB.g===g}" data-a="obg" data-v="${g}">${g}성</button>`).join('')}</div></div>
  <div class="foot" style="border:0;align-items:center">${dots(1)}<button class="link" data-a="ob" data-n="2">나중에 할게요</button></div>`;

// 2-태어난 해,월,일
V.ob2=()=>{const y=TODAY.getFullYear();return `${top('')}<div class="scr center" style="gap:22px"><p class="h1"><em>나이</em>에 맞는 지원 혜택을<br>찾아 드려요</p>
  <div class="choice"><label class="sub" for="by" style="text-align:left">태어난 해</label><select id="by"><option value="">태어난 해</option>${Array.from({length:70},(_,i)=>y-40-i).map(v=>`<option ${OB.y==v?'selected':''}>${v}</option>`).join('')}</select>
  <div class="row"><select id="bm" aria-label="태어난 월"><option value="">월</option>${Array.from({length:12},(_,i)=>i+1).map(v=>`<option value="${v}" ${OB.m==v?'selected':''}>${v}월</option>`).join('')}</select>
  <select id="bd" aria-label="태어난 일"><option value="">일</option>${Array.from({length:31},(_,i)=>i+1).map(v=>`<option value="${v}" ${OB.d==v?'selected':''}>${v}일</option>`).join('')}</select></div>
  <button class="btn" data-a="oby">다음</button></div></div>
  <div class="foot" style="border:0;align-items:center">${dots(2)}<button class="link" data-a="ob" data-n="3">나중에 할게요</button></div>`};

// 3-사는 곳(시·도 / 시·군·구)
V.ob3=()=>`${top('')}<div class="scr center" style="gap:22px"><p class="h1"><em>우리 동네</em>에서 받을 수 있는<br>혜택을 알려 드려요</p>
  <div class="choice"><select id="sd"><option value="">시·도</option>${SIDO_LIST.map(s=>`<option ${OB.sd===s?'selected':''}>${s}</option>`).join('')}</select>
  <select id="sg"><option value="">시·군·구</option>${OB.sd?[...SIDO[OB.sd]].sort().map(s=>`<option ${OB.sg===s?'selected':''}>${s}</option>`).join('')+'<option value="">그 외 지역</option>':''}</select>
  <button class="btn" data-a="obdone">혜택 찾기</button></div></div>
  <div class="foot" style="border:0;align-items:center">${dots(3)}<button class="link" data-a="obdone" data-skip="1">나중에 할게요</button></div>`;

// 혜택 찾는 중 로딩
V.ob_load=()=>`${top('',true)}<div class="scr center" style="gap:24px">${LOGO}<div class="spin"></div><p class="h1" style="font-size:22px">딱 맞는 정보를<br>찾는 중…</p></div>`;


// 맞춤 혜택
function item(p,why,closedNote){return `<button class="item" data-a="pol" data-id="${p.id}"><span class="ic">${CAT_IC[p.c]||IC.star}</span><span class="tx"><b>${esc(p.n)}</b><small>${esc(p.d||p.org||p.c)}</small>${why.length?`<span class="why">${why.slice(0,3).map(w=>`<span class="chip ${/확인/.test(w)?'warn':/마감/.test(w)?'red':''}">${esc(w)}</span>`).join('')}</span>`:''}</span><span class="chev">›</span></button>`}
let REC={key:null,data:null};
function loadRec(){const me=ME||{};const key=JSON.stringify(me);if(REC.key===key)return;REC={key,data:null};
  api('/api/recommend',me).then(r=>({list:r.list.map(x=>({p:POL[x.id],s:x.score,why:x.why})).filter(x=>x.p),closed:r.closed,age:r.age}))
   .catch(()=>recommendLocal(me)).then(d=>{if(REC.key===key){REC.data=d;if(S.screen==='rec'){S.keepScroll=true;render()}}});}
V.rec=()=>{loadRec();if(!REC.data)return V.ob_load();const me=ME||{};const R=REC.data;const cats=['전체',...new Set(R.list.map(x=>x.p.c))];const f=S.params.cat||'전체';const L=R.list.filter(x=>f==='전체'||x.p.c===f);const shown=L.slice(0,S.params.more?999:20);
  if(!R.list.length)return `${top('')}<div class="scr center" style="gap:16px"><div class="hero-ic">${IC.search}</div><p class="h1" style="font-size:23px">맞는 혜택을<br>찾지 못했어요</p><p class="sub">내 정보를 바꿔서 다시 찾아볼까요?</p></div><div class="foot"><button class="btn" data-a="go" data-s="myinfo">내 정보 바꾸기</button><button class="btn alt" data-a="home">처음으로</button></div>`;
  return `${top('')}<div class="scr"><p class="h1" style="font-size:24px">${me.sd||me.y||me.g?'나에게 맞는 혜택이':'모두가 볼 수 있는 혜택이'}<br><em>${R.list.length}개</em> 있어요</p>
  ${!(me.sd&&me.y)?'<p class="sub" style="font-size:14px">나이와 사는 곳을 알려 주시면 더 정확해져요</p>':''}
  <div class="filters" role="group" aria-label="분야">${cats.map(c=>`<button aria-pressed="${c===f}" data-a="cat" data-v="${c}">${c}</button>`).join('')}</div>
  <div class="list">${shown.map(x=>item(x.p,x.why)).join('')}</div>
  ${L.length>shown.length?`<button class="btn soft sm" data-a="more">${L.length-shown.length}개 더 보기</button>`:''}
  ${R.closed?`<p class="ai-note">신청 기간이 끝난 혜택 ${R.closed}개는 숨겼어요</p>`:''}
</div><div class="foot"><div class="row"><button class="btn alt sm" data-a="home">처음으로</button><button class="btn sm" data-a="go" data-s="myinfo">내 정보</button></div></div>`};


// 전화번호 파싱
const FULL_TEL=/^(\d{2,4}-\d{3,4}-\d{4}|\d{3,4}-\d{4})$/;
function parseTels(raw){
  const out=[];
  String(raw||'').split(/\s*\/\s*|\n/).forEach(seg=>{
    const colon=seg.indexOf(':');
    const segLabel=colon>0&&!/\d/.test(seg.slice(0,colon))?seg.slice(0,colon).trim():'';   // "평일 주간: ..." 의 앞부분
    const re=/\d[\d-]*\d|\d/g; let m, last=null, prevEnd=colon>0?colon+1:0;
    while((m=re.exec(seg))){
      const tok=m[0], before=seg.slice(prevEnd,m.index), after=seg.slice(m.index+tok.length);
      prevEnd=m.index+tok.length;
      const lastGroup=last?last.num.split('-').pop():'';
      if(/내선\s*$/.test(before)&&last){ last.note=`내선 ${tok}`; continue; }                       // 032-654-4024(내선660)
      if(last&&/^\d+$/.test(tok)&&tok.length<=lastGroup.length&&/^\s*[~,]\s*$/.test(before)){
        const full=lastGroup.slice(0,lastGroup.length-tok.length)+tok;                            // 9840~2 → 9842
        if(before.includes('~')){ last.note=`${full}번까지`; continue; }
        const num=last.num.replace(/\d+$/,full);                                                   // 1291,1294 → 02-410-1294
        const paren=after.match(/^\s*\(([^)]+)\)/), base=last;
        if(paren&&!/^내선/.test(paren[1])&&!base.label) base.label=paren[1].trim();                  // "0615,0613 (보건소)" → 두 번호 모두 보건소
        last={num,dial:num.replace(/-/g,''),label:base.label,note:''}; out.push(last); continue;
      }
      const special=(/^1\d{3}$/.test(tok)&&!/[-\d]$/.test(before))||(seg.trim()===tok&&/^\d{3,4}$/.test(tok)); // 1355, 129 같은 대표번호
      if(!FULL_TEL.test(tok)&&!special) continue;                                                  // "외 15곳"의 15, "032-718-각…" 등은 무시
      let paren=after.match(/^\s*\(([^)]+)\)/);
      if(paren&&/^내선/.test(paren[1])) paren=null;                                                 // (내선660)은 이름이 아니라 내선번호
      const word=before.replace(/[():,~]|또는|및/g,' ').trim();
      const label=(paren&&paren[1].trim())||(word&&!/^\d/.test(word)?word:'')||segLabel;
      last={num:tok,dial:tok.replace(/-/g,''),label,note:''}; out.push(last);
    }
  });
  const seen=new Set(); return out.filter(t=>!seen.has(t.dial)&&seen.add(t.dial));               // 같은 번호 두 번 나오면 하나만
}



// 혜택 상세
V.pol=()=>{const p=POL[S.params.id];const who=[p.a0!=null?`${p.a0}세 이상${p.a1?` ${p.a1}세 이하`:''}`:'',!(p.m&&p.f)?(p.f?'여성':'남성'):'',p.q].filter(Boolean).join(' · ')||'담당 기관에 물어보세요';
  const how=[p.how,p.at&&('장소: '+p.at),p.todo&&('준비: '+p.todo)].filter(Boolean).join('\n')||'담당 기관에 물어보세요';
  const e=endDate(p.t);
  return `${top(p.c)}<div class="scr"><div class="center" style="display:flex;flex-direction:column;gap:8px"><div class="hero-ic">${CAT_IC[p.c]||IC.star}</div><p class="h1" style="font-size:24px">${esc(p.n)}</p><p class="sub">${esc(p.sd?(p.sd+' '+(p.sg.join(', ')||'전체')):'전국')}${e?` · ${e.getMonth()+1}월 ${e.getDate()}일까지`:''}</p></div>
  <div class="card qa"><div><h4>무엇을 받나요?</h4><p>${esc(p.d||'자세한 내용은 아래 전화로 물어보세요.')}</p></div><div><h4>누가 받나요?</h4><p>${esc(who)}</p></div><div><h4>어떻게 신청하나요?</h4><p style="white-space:pre-wrap">${esc(how)}</p></div>${p.t?`<div><h4>언제 신청하나요?</h4><p>${esc(p.t)}</p></div>`:''}</div>
  <div class="card" id="easy-box"><button class="btn soft sm" data-a="poleasy">더 쉬운 말로 풀어 듣기</button></div>
  ${p.u?`<a class="link" style="text-align:center" href="${esc(p.u)}" target="_blank" rel="noopener">기관 홈페이지에서 원문 보기 ↗</a>`:''}
</div><div class="foot">${telFoot(p)}</div>`};

function telFoot(p){
  const tels=parseTels(p.tel);
  if(!tels.length) return `<div class="kv"><span><small>담당</small><b style="font-size:17px">${esc(p.org||'주소지 행정복지센터')}</b></span></div><p class="ai-note">${p.tel?esc(p.tel)+'에 물어보세요.':'전화번호가 데이터에 없어요. 가까운 행정복지센터에 물어보세요.'}</p>`;
  const t=tels[0], more=tels.length-1;
  return `<div class="kv"><span><small>${esc(t.label||p.org||'문의')}</small><span class="tel">${esc(t.num)}</span>${t.note?`<small>${esc(t.note)}</small>`:''}${more?`<span class="chip" style="margin-top:4px;display:inline-block">외 ${more}곳 더 있어요</span>`:''}</span><button class="pill-btn" data-a="copy" data-v="${esc(t.num)}">번호 복사</button></div>`
    +(more?`<button class="btn" data-a="tels">전화로 물어보기 · ${tels.length}곳 중 고르기</button>`:`<a class="btn" href="tel:${esc(t.dial)}">전화로 물어보기</a>`);
}
// 번호 여러 개일 때
function openTelSheet(){
  const p=POL[S.params.id], tels=parseTels(p.tel);
  const el=document.createElement('div'); el.className='sheet'; el.dataset.a='telclose';
  el.innerHTML=`<div class="sheet-panel" role="dialog" aria-label="전화할 곳 고르기">
    <div class="kv"><b style="font-size:22px">어디로 전화할까요?</b><button class="pill-btn" data-a="telclose">닫기</button></div>
    ${tels.map(t=>`<div class="card telrow"><b>${esc(t.label||p.org||'문의')}</b><span class="tel">${esc(t.num)}</span>${t.note?`<small>${esc(t.note)}</small>`:''}
      <div class="row"><a class="btn sm" href="tel:${esc(t.dial)}">전화 걸기</a><button class="btn alt sm" data-a="copy" data-v="${esc(t.num)}">번호 복사</button></div></div>`).join('')}
</div>`;
  $app.appendChild(el);
}
async function polEasy(){const p=POL[S.params.id];const box=document.getElementById('easy-box');
  box.innerHTML='<p class="sub" id="ez">생각하는 중…</p>';
  try{const r=await api('/api/explain',{id:p.id});
    if(r.offline){box.innerHTML=`<h4 style="margin:0 0 6px;color:var(--blue)">단어장 풀이</h4><div class="wchips">${r.hits.map(w=>`<button data-a="word" data-w="${esc(w.w)}"><b>${esc(w.w)}</b><span>${esc(w.e)}</span></button>`).join('')||'<span class="sub">어려운 단어가 없어요</span>'}</div>`;return}
    box.innerHTML=`<h4 style="margin:0 0 6px;color:var(--blue);display:flex;align-items:center">쉽게 풀면${canSpeak?`<button class="pill-btn" style="margin-left:auto" data-a="speakt">${IC.sound}</button>`:''}</h4><p style="margin:0;font-size:18px" id="ez">${esc(r.text)}</p>`;
  }catch(e){box.innerHTML='<p class="sub">지금은 풀어 드릴 수 없어요. 위 내용을 확인해 주세요.</p>'}}



// 내 정보 (성별·나이·사는 곳 바꾸기, 정보 지우기)
V.myinfo=()=>{const me=ME||{};const a=manAge(me.y,me.m,me.d);return `${top('')}<div class="scr"><p class="h1" style="font-size:24px">내 정보</p>
  <div class="card kv"><span><small>성별</small><b>${me.g?esc(me.g)+'성':'입력 안 함'}</b></span><button class="pill-btn" data-a="edit" data-n="1">바꾸기</button></div>
  <div class="card kv"><span><small>나이</small><b>${a!=null?'만 '+a+'세':'입력 안 함'}</b></span><button class="pill-btn" data-a="edit" data-n="2">바꾸기</button></div>
  <div class="card kv"><span><small>사는 곳</small><b>${me.sd?esc(me.sd+' '+(me.sg||'')):'입력 안 함'}</b></span><button class="pill-btn" data-a="edit" data-n="3">바꾸기</button></div>
  <p class="sub" style="text-align:center;font-size:15px">바꾸면 맞춤 혜택도 바로 바뀌어요</p>
  <button class="link" data-a="reset">내 정보 모두 지우기</button></div>
  <div class="foot"><button class="btn" data-a="recgo">혜택 다시 보기</button></div>`};


// 단어 사전
const KO_INIT=['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
function initial(w){const c=w.charCodeAt(0);if(c<0xAC00||c>0xD7A3)return 'A-Z';const i=Math.floor((c-0xAC00)/588);return ['ㄱ','ㄱ','ㄴ','ㄷ','ㄷ','ㄹ','ㅁ','ㅂ','ㅂ','ㅅ','ㅅ','ㅇ','ㅈ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'][i]}
const CAT_DESC={'복지':'돌봄, 연금, 식사, 일자리','보건':'검진, 예방접종, 병원','교통':'교통카드, 버스, 운전','행정':'신청서, 서류, 기관','기타':'생활 지원, 그 밖의 말'};

// 단어 검색
V.dict=()=>{const rec=store.get('recent',[]);return `${top('')}<div class="scr"><div class="center" style="display:flex;flex-direction:column;gap:6px;align-items:center"><div class="hero-ic">${IC.book}</div><p class="h1" style="font-size:24px">단어사전</p><p class="sub" style="font-size:14px">어려운 단어 ${WORDS.length}개</p></div>
  <form id="dq" role="search" class="sbox"><input id="q" type="search" placeholder="검색어를 입력해주세요" autocomplete="off"><button type="button" id="qx" class="sclr" aria-label="입력한 글자 모두 지우기" hidden><svg width="26" height="26" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg></button><button class="sgo" aria-label="검색">${IC.search}</button></form>
  ${rec.length?`<div><p class="sub" style="font-size:14px;margin-bottom:4px">최근 검색어</p><div class="recent">${rec.map(r=>`<div><button data-a="q" data-v="${esc(r)}">${esc(r)}</button><button class="x" data-a="qdel" data-v="${esc(r)}" aria-label="지우기">×</button></div>`).join('')}</div><button class="link" style="float:right" data-a="qclr">전체 삭제</button></div>`:''}
</div><div class="foot"><div class="row"><button class="btn sm" data-a="go" data-s="dcat">분야별 검색</button><button class="btn alt sm" data-a="go" data-s="dabc">가나다순</button></div></div>`};
// 검색 결과
V.dres=()=>{const q=S.params.q;
  const norm=t=>String(t).toLowerCase().replace(/\s+/g,''),nq=norm(q);
  const L=WORDS.filter(w=>norm(w.w).includes(nq)||norm(w.e).includes(nq)).sort((a,b)=>(norm(b.w)===nq)-(norm(a.w)===nq)||(norm(b.w).startsWith(nq))-(norm(a.w).startsWith(nq)));
  if(!L.length)return `${top('',true)}<div class="scr center" style="gap:16px"><div class="hero-ic">${IC.search}</div><p class="h1" style="font-size:23px">검색 결과를<br>찾지 못했어요</p><p class="sub">다시 검색하거나 분야별 / 가나다순 검색에서 찾아볼까요?</p></div><div class="foot"><button class="btn" data-a="back">다시 검색하기</button><button class="btn alt" data-a="go" data-s="dcat">분야별 검색하기</button></div>`;
  return `${top('"'+q+'" 검색 결과')}<div class="scr"><div class="list">${L.slice(0,60).map(wordItem).join('')}</div></div>`};
const wordItem=w=>`<button class="item" data-a="word" data-w="${esc(w.w)}"><span class="tx"><b>${esc(w.w)}</b><small>${esc(w.e)}</small></span><span class="chev">›</span></button>`;
// 분야별 검색
V.dcat=()=>{const cnt={};WORDS.forEach(w=>cnt[w.c]=(cnt[w.c]||0)+1);return `${top('')}<div class="scr"><p class="h1" style="font-size:24px"><em>분야</em>별 검색<br><span style="font-size:18px;font-weight:500">궁금한 분야를 선택해주세요</span></p>
  <div class="list">${Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]).map(c=>`<button class="item" data-a="go" data-s="dlist" data-c="${c}"><span class="ic">${CAT_IC[c]||IC.star}</span><span class="tx"><b>${c} <span style="color:var(--muted);font-size:14px">${cnt[c]}개</span></b><small>${CAT_DESC[c]||''}</small></span><span class="chev">›</span></button>`).join('')}</div></div>
  <div class="foot"><button class="btn" data-a="go" data-s="dict">검색창으로</button></div>`};
// 분야별 단어 목록
V.dlist=()=>{const c=S.params.c;const L=WORDS.filter(w=>w.c===c).sort((a,b)=>a.w.localeCompare(b.w,'ko'));return `${top('')}<div class="scr"><p class="h1" style="font-size:24px"><em>${esc(c)}</em> 단어</p><div class="list">${L.map(wordItem).join('')}</div></div>`};
// ㄱ~ㅎ 가나다순
V.dabc=()=>{const k=S.params.k||'ㄱ';const L=WORDS.filter(w=>initial(w.w)===k).sort((a,b)=>a.w.localeCompare(b.w,'ko'));return `${top('가나다순')}<div class="scr"><div class="alpha">${[...KO_INIT,'A-Z'].map(x=>`<button aria-pressed="${x===k}" data-a="abc" data-v="${x}" style="${x==='A-Z'?'width:auto;padding:0 10px':''}">${x}</button>`).join('')}</div><div class="list">${L.map(wordItem).join('')||'<p class="sub">이 글자로 시작하는 단어가 없어요</p>'}</div></div>`};
// 단어 상세
V.word=()=>{const w=WORDS.find(x=>x.w===S.params.w);if(!w)return V.dres();const ps=w.p.map(i=>POL[i]).filter(Boolean).slice(0,5);return `${top('단어사전')}<div class="scr"><div class="center" style="display:flex;flex-direction:column;gap:8px;align-items:center"><div class="hero-ic">${CAT_IC[w.c]||IC.star}</div><span class="chip">${esc(w.c)}</span><p class="h1" style="font-size:26px">${esc(w.w)}</p></div>
  <div class="card" style="background:var(--sky2);border-color:#9DB6F5"><small style="color:var(--blue);font-weight:700">쉬운 말로</small><p style="margin:4px 0 0;font-size:21px;font-weight:700">${esc(w.e)}</p>${canSpeak?`<button class="pill-btn" style="margin-top:10px;display:inline-flex;gap:4px;align-items:center" data-a="speakw">${IC.sound} 듣기</button>`:''}</div>
  ${ps.length?`<div><p class="sub" style="font-size:15px;margin-bottom:6px">이 단어가 나오는 혜택</p><div class="list">${ps.map(p=>item(p,[])).join('')}</div></div>`:''}</div>
  <div class="foot"><div class="row"><button class="btn alt sm" data-a="go" data-s="dict">다시 검색하기</button><button class="btn sm" data-a="go" data-s="dcat">분야별 검색</button></div></div>`};


function setupTopBtn(){
  const sc=$app.querySelector('.scr'); if(!sc)return;
  const btn=document.createElement('button');
  btn.className='to-top'; btn.setAttribute('aria-label','맨 위로 가기');
  btn.innerHTML='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V5M5 12l7-7 7 7"/></svg>';
  const foot=$app.querySelector('.foot');
  btn.style.bottom=((foot?foot.offsetHeight:0)+16)+'px';
  btn.onclick=()=>sc.scrollTo({top:0,behavior:'smooth'});
  $app.appendChild(btn);
  const upd=()=>btn.classList.toggle('show',sc.scrollTop>200);
  sc.addEventListener('scroll',upd,{passive:true}); upd();
}


function render(){ $app.innerHTML=(V[S.screen]||V.home)(); const sc=$app.querySelector('.scr'); if(sc&&!S.keepScroll)sc.scrollTop=0; S.keepScroll=false; after(); }
function after(){
  setupTopBtn();
  ['f-cam','f-alb','f-cam2','f-alb2'].forEach(id=>{const el=document.getElementById(id);if(el)el.onchange=()=>{const f=el.files&&el.files[0];if(f){if(S.screen==='tr_err')S.stack.pop();runTranslate({file:f})}}});
  const qi=document.getElementById('q'),qx=document.getElementById('qx');
  if(qi&&qx){const upd=()=>{qx.hidden=!qi.value};qi.oninput=upd;upd();qx.onclick=()=>{qi.value='';upd();qi.focus()}}
  const dq=document.getElementById('dq');if(dq)dq.onsubmit=e=>{e.preventDefault();const q=document.getElementById('q').value.trim();if(!q)return toast('검색어를 입력해 주세요'); /* [수정] 빈 검색어 안내 */ search(q)};
  const sd=document.getElementById('sd');if(sd)sd.onchange=()=>{OB.sd=sd.value;OB.sg='';render()};
  const sg=document.getElementById('sg');if(sg)sg.onchange=()=>{OB.sg=sg.value};
  const st=document.getElementById('ai-state');if(st){statusP.then(()=>{st.textContent=AI_ON?'AI 번역 켜짐':'AI 키가 없어 단어장 번역으로 동작해요'})}
}
function search(q){let r=store.get('recent',[]).filter(x=>x!==q);r.unshift(q);store.set('recent',r.slice(0,7));go('dres',{q})}
function saveMe(){ME={...OB};store.set('me',ME)}
$app.addEventListener('click',e=>{
  const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
  if(a==='back')return back(); if(a==='home')return home();
  if(a==='go')return go(b.dataset.s,{c:b.dataset.c});
  if(a==='find'){ if(ME)return go('rec'); OB={};return go('ob0'); }
  if(a==='example')return runTranslate({text:EXAMPLE});
  if(a==='trtext'){const t=document.getElementById('t-in').value.trim();if(!t)return toast('글을 먼저 넣어 주세요');return runTranslate({text:t})}
  if(a==='cancel'){ctl&&ctl.abort();return back()}
  if(a==='speak')return speak((TR.res.summary?TR.res.summary+'. ':'')+TR.res.easy);
  if(a==='speakt'){const ez=document.getElementById('ez');return speak(ez?ez.textContent:'')}
  if(a==='speakw'){const w=WORDS.find(x=>x.w===S.params.w);return speak(w.w+'. 쉬운 말로, '+w.e)}
  if(a==='word')return go('word',{w:b.dataset.w});
  if(a==='pol')return go('pol',{id:+b.dataset.id});
  if(a==='poleasy')return polEasy();
  if(a==='tels')return openTelSheet();
  if(a==='telclose'){if(e.target===b){b.closest('.sheet')?.remove()}return}
  if(a==='copy'){const v=b.dataset.v;navigator.clipboard?.writeText(v).then(()=>toast('번호를 복사했어요'),()=>toast(v));return}
  if(a==='ob')return go('ob'+b.dataset.n);
  if(a==='obg'){OB.g=b.dataset.v;return go('ob2')}
  if(a==='oby'){OB.y=+document.getElementById('by').value||null;OB.m=+document.getElementById('bm').value||null;OB.d=+document.getElementById('bd').value||null;if(!OB.y)return toast('태어난 해를 골라 주세요');return go('ob3')}
  if(a==='obskip'){OB={};saveMe();S.stack=[{screen:'home',params:{}}];S.screen='rec';S.params={};return render()}
  if(a==='obdone'){ if(b.dataset.skip){OB.sd='';OB.sg=''} else {OB.sd=document.getElementById('sd').value;OB.sg=document.getElementById('sg').value; if(!OB.sd)return toast('시·도를 골라 주세요')}
    saveMe(); S.screen='ob_load';render(); setTimeout(()=>{S.stack=[{screen:'home',params:{}}];S.screen='rec';S.params={};render()},1100); return }
  if(a==='edit'){OB={...(ME||{})};S.editing=true;return go('ob'+b.dataset.n)}
  if(a==='recgo'){S.stack=[{screen:'home',params:{}}];S.screen='rec';S.params={};return render()}
  if(a==='reset'){ME=null;store.set('me',null);toast('내 정보를 지웠어요');return home()}
  if(a==='cat'){S.params={cat:b.dataset.v};S.keepScroll=true;return render()}
  if(a==='more'){S.params.more=1;S.keepScroll=true;return render()}
  if(a==='q')return search(b.dataset.v);
  if(a==='qdel'){store.set('recent',store.get('recent',[]).filter(x=>x!==b.dataset.v));return render()}
  if(a==='qclr'){store.set('recent',[]);return render()}
  if(a==='abc'){S.params={k:b.dataset.v};return render()}
});

// 내 정보 '바꾸기'에서 한 항목만 고치고 바로 저장
const _go=go;
go=function(screen,params){
  if(S.editing&&(screen==='ob2'&&S.screen==='ob1'||screen==='ob3'&&S.screen==='ob2')){saveMe();S.editing=false;S.stack.pop();S.screen='myinfo';S.params={};return render()}
  return _go(screen,params);
};
render();

function navTo(k){
  if(k==='home')return home();
  S.stack=[{screen:'home',params:{}}];S.params={};
  if(k==='find'){ if(ME)S.screen='rec'; else {OB={};S.screen='ob0'} }
  else S.screen=k;
  render();
}
document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>navTo(b.dataset.nav)));
const NAV_OF={tr_start:'tr_start',tr_text:'tr_start',tr_load:'tr_start',tr_res:'tr_start',tr_err:'tr_start',
  ob0:'find',ob1:'find',ob2:'find',ob3:'find',ob_load:'find',rec:'find',pol:'find',
  dict:'dict',dres:'dict',dcat:'dict',dlist:'dict',dabc:'dict',word:'dict',myinfo:'myinfo'};
const _render=render;
render=function(){_render();const cur=NAV_OF[S.screen];document.querySelectorAll('.site-head nav button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.nav===cur)));};
render();


// 홈 화면 추가 안내
(function(){
  const box=document.getElementById('install'),msg=document.getElementById('install-msg'),btn=document.getElementById('install-btn');
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  const mobile=matchMedia('(max-width: 820px)').matches;
  if(standalone||!mobile||store.get('installClosed',false))return;
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  if(ios){msg.textContent='아래 공유 버튼(□↑) → "홈 화면에 추가"를 누르면 앱처럼 쓸 수 있어요';box.hidden=false}
  let prompt=null;
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();prompt=e;btn.hidden=false;box.hidden=false});
  btn.onclick=async()=>{if(!prompt)return;prompt.prompt();await prompt.userChoice.catch(()=>{});prompt=null;box.hidden=true};
  document.getElementById('install-x').onclick=()=>{box.hidden=true;store.set('installClosed',true)};
})();
})();

// PWA: 서비스 워커 등록 (홈 화면에 추가 + 오프라인)
if('serviceWorker' in navigator&&location.protocol!=='file:'){addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}
