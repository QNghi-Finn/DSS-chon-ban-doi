// ===== config API =====
const API_BASE = `${location.origin}/api`; // nếu backend chạy cổng khác, đổi sang http://localhost:5000/api

// ===== helpers =====
function notify(msg){ alert(msg); }
const Tabs = {
  init(){
    const btns = document.querySelectorAll('.tabs button');
    btns.forEach(b => b.onclick = () => {
      btns.forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      b.classList.add('active');
      document.getElementById('tab-'+b.dataset.tab).classList.add('active');
      if(b.dataset.tab==='matches') Matches.load();
      if(b.dataset.tab==='chat') Chat.loadMatches();
    });
  }
};
const storage = {
  setUser(u){ localStorage.setItem('dss.user', JSON.stringify(u)); },
  getUser(){ const s = localStorage.getItem('dss.user'); return s ? JSON.parse(s) : null; },
  clear(){ localStorage.removeItem('dss.user'); },
  requireUser(){ const u = storage.getUser(); if(!u){ location.href='auth.html'; throw new Error('no user'); } return u; }
};

// ===== API =====
const api = {
  async signup(body){
    const r = await fetch(`${API_BASE}/auth/signup`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
    if(!r.ok) throw new Error(await r.text());
    const data = await r.json(); // { userId }
    return { userId: data.userId, email: body.email, fullName: body.fullName };
  },
  async login(body){
    // ưu tiên /auth/login nếu có
    const tryLogin = await fetch(`${API_BASE}/auth/login`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
    if (tryLogin.ok) return await tryLogin.json(); // {userId,email,fullName}
    // fallback dev: /users/by-email
    const r2 = await fetch(`${API_BASE}/users/by-email?email=${encodeURIComponent(body.email)}`);
    if (!r2.ok) throw new Error('Tạo endpoint /api/auth/login hoặc /api/users/by-email để login');
    return await r2.json();
  },
  async recommend(me, top=30){
    const r = await fetch(`${API_BASE}/recommend/${me}?top=${top}`); if(!r.ok) throw new Error('Không tải được gợi ý'); return r.json();
  },
  async swipe(fromUserId, toUserId, direction){
    const r = await fetch(`${API_BASE}/swipe`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({fromUserId, toUserId, direction})});
    if(!r.ok) throw new Error('Swipe thất bại'); return true;
  },
  async matches(me){ const r = await fetch(`${API_BASE}/matches/${me}`); if(!r.ok) throw new Error('Không tải matches'); return r.json(); },
  async messages(matchId){ const r = await fetch(`${API_BASE}/messages/${matchId}`); if(!r.ok) throw new Error('Không tải chat'); return r.json(); },
  async sendMessage(matchId, fromUserId, body){
    const r = await fetch(`${API_BASE}/messages`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({matchId, fromUserId, body})});
    if(!r.ok) throw new Error('Gửi tin nhắn thất bại'); return true;
  }
};

// ===== FEED =====
const Feed = (() => {
  let me, list=[], idx=0, current=null;
  function view(c){
    return `
      <div class="hero">
        <img src="/uploads/${c.candidateId}.jpg" onerror="this.src='/uploads/default_1.jpg'" alt="" />
        <div class="score badge">BT: ${c.btScore ?? '-'} | ${c.elementRelation}</div>
      </div>
      <div class="row" style="margin-top:8px;justify-content:space-between">
        <div><b>${c.name ?? c.candidateId.slice(0,8)}</b></div>
        <button class="ghost" id="btnExplain">Vì sao?</button>
      </div>
      <div class="kv"><div>Ngũ hành</div><div>${c.elementRelation}</div><div>Bát trạch</div><div>${c.batTrach ?? '—'}</div></div>
    `;
  }
  function render(){
    const el = document.getElementById('feedCard');
    if(idx>=list.length){ el.classList.add('empty'); el.innerHTML='<p>Hết gợi ý. Hãy quay lại sau.</p>'; return; }
    current = list[idx]; el.classList.remove('empty'); el.innerHTML = view(current);
    document.getElementById('btnExplain').onclick = () => Explain.openFor(current);
  }
  async function like(dir){ if(!current) return; await api.swipe(me.userId, current.candidateId, dir); idx++; render(); }

  return { async init(){
    me = storage.requireUser();
    try{
      list = await api.recommend(me.userId, 50);
      idx=0; render();
      document.getElementById('btnLike').onclick = () => like(1);
      document.getElementById('btnSkip').onclick = () => like(-1);
    }catch(e){ notify(e.message); }
  }};
})();

// ===== Explain modal =====
const Explain = {
  openFor(c){
    const rows = [
      {k:'Ngu hanh', v:c.elementRelation, d:c.elementRelation==='Sinh'?'+28':(c.elementRelation==='Same'?'+12':'0')},
      {k:'Bat trach', v:c.batTrach ?? '—', d:c.btScore? (c.btScore>0?`+${c.btScore}`:`${c.btScore}`) : '0'}
    ];
    document.getElementById('explainBody').innerHTML = rows.map(r =>
      `<div class="item"><span>${r.k}: <b>${r.v}</b></span><span class="delta ${String(r.d).startsWith('+')?'pos':'neg'}">${r.d}</span></div>`
    ).join('');
    dlgExplain.showModal();
  }
};

// ===== Matches =====
const Matches = (() => {
  async function load(){
    const me = storage.requireUser();
    const data = await api.matches(me.userId);
    const box = document.getElementById('matchesList');
    box.innerHTML = data.map(m => {
      const other = (m.userA === me.userId) ? m.userB : m.userA;
      return `<div class="match-card">
        <img src="/uploads/${other}.jpg" onerror="this.src='/uploads/default_1.jpg'"/>
        <div class="body">
          <div><b>${other}</b></div>
          <div class="small">Matched: ${new Date(m.matchedAt || Date.now()).toLocaleString()}</div>
          <div class="row" style="margin-top:8px"><button class="primary" onclick="Chat.open('${m.id}','${other}')">Chat</button></div>
        </div></div>`;
    }).join('');
  }
  return { init: load, load };
})();

// ===== Chat =====
const Chat = (() => {
  let me, current={matchId:null, otherId:null};
  async function loadMatches(){
    const data = await api.matches(storage.requireUser().userId);
    const box = document.getElementById('chatMatches');
    box.innerHTML = data.map(m => {
      const other = (m.userA === storage.getUser().userId) ? m.userB : m.userA;
      return `<div class="row" style="padding:8px;border-bottom:1px solid var(--border)">
        <img src="/uploads/${other}.jpg" onerror="this.src='/uploads/default_1.jpg'" style="width:40px;height:40px;border-radius:50%"/>
        <div style="flex:1"><div><b>${other}</b></div><button class="link" onclick="Chat.open('${m.id}','${other}')">Mở chat</button></div>
      </div>`;
    }).join('');
  }
  async function open(matchId, otherId){
    me = storage.requireUser(); current = {matchId, otherId};
    document.getElementById('chatHeader').textContent = `Chat với ${otherId}`;
    document.getElementById('chatForm').classList.remove('hidden');
    await renderMessages();
  }
  async function renderMessages(){
    const list = await api.messages(current.matchId);
    const body = document.getElementById('chatBody');
    body.innerHTML = list.map(m => `<div class="msg ${m.fromUserId===storage.getUser().userId?'me':'other'}">${escapeHtml(m.body)}</div>`).join('');
    body.scrollTop = body.scrollHeight;
  }
  function escapeHtml(s){return s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function init(){
    const form = document.getElementById('chatForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const txt = form.msg.value.trim(); if(!txt) return;
      form.msg.value = ''; await api.sendMessage(current.matchId, storage.getUser().userId, txt); await renderMessages();
    });
  }
  return { init, open, loadMatches };
})();
