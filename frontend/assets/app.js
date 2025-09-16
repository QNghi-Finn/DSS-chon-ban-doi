/* =======================
 *  DSS Mate - app.js
 *  version: clean + dual data source (mock/sql)
 * ======================= */

/* ===== CONFIG ===== */
const API_BASE    = "http://127.0.0.1:5000/api";   // sửa nếu backend chạy port/host khác
const DATA_SOURCE = "mock";                         // "mock" | "sql"
const ORIGIN_FE   = location.origin;

/* ===== HELPERS ===== */
function notify(msg){ alert(msg); }

const storage = {
  setUser(u){ localStorage.setItem('dss.user', JSON.stringify(u)); },
  getUser(){ try{ return JSON.parse(localStorage.getItem('dss.user')||'null'); }catch{ return null; } },
  clear(){ localStorage.removeItem('dss.user'); },
  requireUser(){
    const u = storage.getUser();
    if(!u){ alert('Ban chua dang nhap'); location.href = 'auth.html'; throw new Error('no user'); }
    return u;
  }
};

/* ===== API namespace (DUY NHẤT) ===== */
window.api = {
  /* ---- AUTH ---- */

  /** Đăng ký (mock): FormData gồm {email,password,fullName,gender,birthday,avatar?,education?,occupation?,nativeland?,bio?} */
  async signupMock(formData){
    const r = await fetch(`${API_BASE}/mock/signup`, { method: 'POST', body: formData });
    if(!r.ok) throw new Error(await r.text());
    const { profile } = await r.json();
    return {
      userId:   profile.UserID,
      fullName: profile.FullName,
      avatarUrl: profile.Avatar
    };
  },

  /** Đăng nhập (mock-auth) */
  async loginMock({email, password}){
    const r = await fetch(`${API_BASE}/mock-auth/login`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({email, password})
    });
    if(!r.ok) throw new Error(await r.text());
    const data = await r.json(); // { ok, user:{ id, email, fullName, avatarUrl } }
    return { userId: data.user.id, email: data.user.email, fullName: data.user.fullName, avatarUrl: data.user.avatarUrl };
  },

  /** Đăng ký (SQL thật, JSON body) */
  async signupReal(body){
    const r = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
    });
    if(!r.ok) throw new Error(await r.text());
    return await r.json(); // {userId}
  },

  /** Đăng nhập (SQL thật) */
  async loginReal(body){
    const r = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
    });
    if(!r.ok) throw new Error(await r.text());
    return await r.json(); // {userId,email,fullName}
  },

  /* ---- CANDIDATES SEARCH ---- */
  async searchCandidates(filters){
    if (DATA_SOURCE === "mock"){
      // map filters -> query string
      const p = new URLSearchParams();
      if (filters?.q)       p.set("q", filters.q);
      if (filters?.gender)  p.set("gender", filters.gender);
      if (filters?.ageMin)  p.set("ageMin", filters.ageMin);
      if (filters?.ageMax)  p.set("ageMax", filters.ageMax);
      if (filters?.job)     p.set("job", filters.job);
      p.set("page","1"); p.set("pageSize","50");

      const r = await fetch(`${API_BASE}/mock/profiles?${p.toString()}`);
      if(!r.ok) throw new Error('Khong tai duoc du lieu mock');
      const data = await r.json();              // { total, items: [...] }
      return data.items;                         // chuẩn FE: mảng candidates
    }

    // SQL thật
    const r = await fetch(`${API_BASE}/candidates/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters || {})
    });
    if (!r.ok) throw new Error("Khong tai duoc du lieu SQL");
    return await r.json();                       // mảng candidates
  },

  /* ---- SWIPE / MATCH / MESSAGE ---- (dùng chung cho mock & sql nếu backend có) */
  async swipe(fromUserId, toUserId, direction){
    const r = await fetch(`${API_BASE}/swipe`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({fromUserId, toUserId, direction})
    });
    if(!r.ok) throw new Error(await r.text());
    return await r.json(); // {ok, matchId?}
  },

  async matches(me){
    const r = await fetch(`${API_BASE}/matches/${encodeURIComponent(me)}`);
    if(!r.ok) throw new Error(await r.text());
    return await r.json();
  },

  async messages(matchId){
    const r = await fetch(`${API_BASE}/messages/${encodeURIComponent(matchId)}`);
    if(!r.ok) throw new Error(await r.text());
    return await r.json();
  },

  async sendMessage(matchId, fromUserId, body){
    const r = await fetch(`${API_BASE}/messages`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({matchId, fromUserId, body})
    });
    if(!r.ok) throw new Error(await r.text());
    return await r.json();
  }
};

/* ====== FE MODULES (tuỳ bạn dùng, để sẵn hàm gọi) ====== */

/* ---- Feed (deck swipe) ---- */
const Feed = (() => {
  let me, list=[], idx=0, current=null;

  function cardView(c){
    return `
      <div class="hero">
        <img src="${c.avatarUrl || '/uploads/default_1.jpg'}" onerror="this.src='/uploads/default_1.jpg'"/>
      </div>
      <div class="row" style="justify-content:space-between;margin-top:8px">
        <div><b>${c.fullName || c.id}</b> ${c.age?`, ${c.age} tuoi`:''}</div>
        <button id="btnExplain" class="ghost">Vi sao?</button>
      </div>
      <div class="kv">
        <div>Cong viec</div><div>${c.occupation || '—'}</div>
        <div>Tai chinh</div><div>${c.finance? c.finance+' tr/thang':'—'}</div>
      </div>
    `;
  }

  function render(){
    const el = document.getElementById('feedCard');
    if(!el) return;
    if(idx>=list.length){ el.classList.add('empty'); el.innerHTML='<p>Het goi y.</p>'; return; }
    current = list[idx];
    el.classList.remove('empty');
    el.innerHTML = cardView(current);
    const btnExplain = document.getElementById('btnExplain');
    if (btnExplain) btnExplain.onclick = () => Explain.openFor(current);
  }

  async function like(dir){
    if(!current) return;
    try{
      await api.swipe(me.userId, current.id, dir);
    }catch(e){ console.warn(e); }
    idx++; render();
  }

  return {
    async init(){
      me = storage.requireUser();
      // lần đầu: lấy danh sách theo bộ lọc mặc định rỗng
      list = await api.searchCandidates({});
      idx = 0; render();
      const btnLike = document.getElementById('btnLike');
      const btnSkip = document.getElementById('btnSkip');
      if (btnLike) btnLike.onclick = () => like(1);
      if (btnSkip) btnSkip.onclick = () => like(-1);
    }
  };
})();

/* ---- Explain ---- */
const Explain = {
  openFor(c){
    const body = document.getElementById('explainBody');
    if (!body) return;
    const rows = [
      {k:'Ho ten', v:c.fullName || '—', d:''},
      {k:'Cong viec', v:c.occupation || '—', d:''},
      {k:'Tai chinh', v:c.finance? `${c.finance} tr/thang` : '—', d:''}
    ];
    body.innerHTML = rows.map(r =>
      `<div class="item"><span>${r.k}: <b>${r.v}</b></span><span class="delta"></span></div>`
    ).join('');
    if (window.dlgExplain?.showModal) dlgExplain.showModal();
  }
};

/* ---- Matches ---- */
const Matches = (() => {
  async function load(){
    const me = storage.requireUser();
    const data = await api.matches(me.userId);
    const box = document.getElementById('matchesList');
    if (!box) return;
    box.innerHTML = data.map(m => {
      const other = (m.userA === me.userId) ? m.userB : m.userA;
      return `<div class="match-card">
        <img src="/uploads/${other}.jpg" onerror="this.src='/uploads/default_1.jpg'"/>
        <div class="body">
          <div><b>${other}</b></div>
          <div class="row" style="margin-top:8px">
            <button class="primary" onclick="Chat.open('${m.id}','${other}')">Chat</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }
  return { load };
})();

/* ---- Chat ---- */
const Chat = (() => {
  let current = { matchId:null, otherId:null };

  async function loadMatches(){
    const me = storage.requireUser();
    const data = await api.matches(me.userId);
    const box = document.getElementById('chatMatches');
    if (!box) return;
    box.innerHTML = data.map(m => {
      const other = (m.userA === me.userId) ? m.userB : m.userA;
      return `<div class="row" style="padding:8px;border-bottom:1px solid var(--border)">
        <img src="/uploads/${other}.jpg" onerror="this.src='/uploads/default_1.jpg'" style="width:40px;height:40px;border-radius:50%"/>
        <div style="flex:1">
          <div><b>${other}</b></div>
          <button class="link" onclick="Chat.open('${m.id}','${other}')">Mo chat</button>
        </div>
      </div>`;
    }).join('');
  }

  async function open(matchId, otherId){
    current = { matchId, otherId };
    const header = document.getElementById('chatHeader');
    if (header) header.textContent = `Chat voi ${otherId}`;
    const form = document.getElementById('chatForm');
    if (form) form.classList.remove('hidden');
    await renderMessages();
  }

  async function renderMessages(){
    const body = document.getElementById('chatBody');
    if (!body || !current.matchId) return;
    const list = await api.messages(current.matchId);
    body.innerHTML = list.map(m =>
      `<div class="msg ${m.fromUserId===storage.getUser()?.userId?'me':'other'}">${escapeHtml(m.body)}</div>`
    ).join('');
    body.scrollTop = body.scrollHeight;
  }

  function escapeHtml(s){ return s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function init(){
    const form = document.getElementById('chatForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const txt = form.msg.value.trim(); if(!txt) return;
      form.msg.value = '';
      await api.sendMessage(current.matchId, storage.getUser().userId, txt);
      await renderMessages();
    });
  }

  return { init, open, loadMatches };
})();

/* ---- Filters on index (optional wiring) ---- */
async function initFilters(){
  const btnFilter = document.getElementById('btnFilter');
  const btnReset  = document.getElementById('btnReset');
  const listBox   = document.getElementById('candidateList');

  if (!btnFilter || !listBox) return;

  btnFilter.addEventListener('click', async () => {
    const filters = {
      q:       (document.getElementById('fltQuery')?.value || '').trim(),
      gender:  document.getElementById('fltGender')?.value || null,
      ageMin:  parseInt(document.getElementById('fltAgeMin')?.value) || null,
      ageMax:  parseInt(document.getElementById('fltAgeMax')?.value) || null,
      distanceKm: parseInt(document.getElementById('fltDistance')?.value) || null,
      job:     (document.getElementById('fltJob')?.value || '').trim() || null,
      financeMax: parseInt(document.getElementById('fltFinance')?.value) || null
    };
    const list = await api.searchCandidates(filters);
    renderCandidates(list);
  });

  if (btnReset){
    btnReset.addEventListener('click', () => {
      ['fltQuery','fltGender','fltAgeMin','fltAgeMax','fltDistance','fltJob','fltFinance']
        .forEach(id => { const el = document.getElementById(id); if(!el) return; el.value = ''; });
      listBox.innerHTML = '<p>Nhap tieu chi de tim kiem…</p>';
    });
  }

  function renderCandidates(list){
    if (!list || list.length===0){
      listBox.innerHTML = '<p>Khong tim thay ung vien phu hop.</p>';
      return;
    }
    listBox.innerHTML = list.map(c => `
      <div class="candidate-card">
        <img src="${c.avatarUrl || '/uploads/default_1.jpg'}" onerror="this.src='/uploads/default_1.jpg'"/>
        <div class="body">
          <div><b>${c.fullName || 'An danh'}</b> ${c.age?`, ${c.age} tuoi`:''}</div>
          <div>Cong viec: ${c.occupation || '—'}</div>
          <div>Tai chinh: ${c.finance? c.finance+' tr/thang' : '—'}</div>
          <div class="row" style="gap:8px;margin-top:6px">
            <button onclick="api.swipe('${storage.getUser()?.userId}','${c.id}',1)">👍 Thich</button>
            <button onclick="api.swipe('${storage.getUser()?.userId}','${c.id}',-1)">👎 Bo qua</button>
          </div>
        </div>
      </div>
    `).join('');
  }
}

/* ---- Export modules to window for inline onclick ---- */
window.storage = storage;
window.Feed = Feed;
window.Matches = Matches;
window.Chat = Chat;
window.initFilters = initFilters;
window.Explain = Explain;

/* ===== END app.js ===== */
