/* Workout-module: routines, actieve workout, rusttimer, records, geschiedenis */

const W = {
  view: 'overzicht',   // 'overzicht' | 'actief' | 'routine'
  actief: null,
  editRoutine: null,
  pickerDoel: 'actief',
  pickerZoek: '',
  pickerSpier: '',
  pickerSelectie: [],
  rust: null,          // { eind: timestamp, totaal: sec }
  tick: null,
  detailChart: null
};

const SET_TYPES = ['N', 'W', 'F', 'D'];
const SET_TYPE_LABEL = { W: 'Warm-up', N: 'Normaal', F: 'Failure', D: 'Dropset' };

function est1RM(kg, reps) { return reps > 0 ? kg * (1 + reps / 30) : kg; }

/* ---------- persistentie actieve workout ---------- */

function saveActief() {
  if (W.actief) localStorage.setItem('actieveWorkout', JSON.stringify(W.actief));
  else localStorage.removeItem('actieveWorkout');
  updateNavBadge();
}

function laadActief() {
  try {
    const raw = localStorage.getItem('actieveWorkout');
    if (raw) { W.actief = JSON.parse(raw); W.view = 'actief'; }
  } catch (e) { localStorage.removeItem('actieveWorkout'); }
}

function updateNavBadge() {
  const dot = document.getElementById('navWorkoutDot');
  if (dot) dot.style.display = W.actief ? 'block' : 'none';
}

/* ---------- statistieken / records ---------- */

function workoutVolume(oefeningen) {
  let vol = 0;
  for (const o of oefeningen) for (const s of o.sets) {
    if (s.done && s.type !== 'W' && s.kg && s.reps) vol += s.kg * s.reps;
  }
  return Math.round(vol);
}

function workoutSets(oefeningen) {
  return oefeningen.reduce((a, o) => a + o.sets.filter(s => s.done).length, 0);
}

/* alle historische werk-sets van een oefening, oudste eerst */
function oefeningHistorie(naam, exclWorkoutId = null) {
  const out = [];
  for (const w of [...App.workouts].reverse()) {
    if (exclWorkoutId != null && w.id === exclWorkoutId) continue;
    for (const o of w.oefeningen) {
      if (o.naam !== naam) continue;
      const sets = o.sets.filter(s => s.done !== false && s.type !== 'W' && s.kg != null && s.reps);
      if (sets.length) out.push({ datum: w.datum, workoutId: w.id, sets });
    }
  }
  return out;
}

function records(naam) {
  let maxKg = null, best1 = null, maxVol = null, totSets = 0;
  for (const h of oefeningHistorie(naam)) {
    for (const s of h.sets) {
      totSets++;
      if (!maxKg || s.kg > maxKg.kg) maxKg = { ...s, datum: h.datum };
      const r1 = est1RM(s.kg, s.reps);
      if (!best1 || r1 > best1.val) best1 = { ...s, val: r1, datum: h.datum };
      const vol = s.kg * s.reps;
      if (!maxVol || vol > maxVol.vol) maxVol = { ...s, vol, datum: h.datum };
    }
  }
  return { maxKg, best1, maxVol, totSets };
}

function vorigeSets(naam) {
  const hist = oefeningHistorie(naam);
  return hist.length ? hist[hist.length - 1].sets : [];
}

/* ---------- weergave ---------- */

function renderWorkout() {
  const el = document.getElementById('view-workout');
  if (!el) return;
  if (W.view === 'actief' && W.actief) renderActieveWorkout(el);
  else if (W.view === 'routine' && W.editRoutine) renderRoutineEditor(el);
  else { W.view = 'overzicht'; renderWorkoutOverzicht(el); }
}

/* --- overzicht --- */

function renderWorkoutOverzicht(el) {
  const routinesHtml = App.routines.map(r => {
    const oefs = r.oefeningen.map(o => `${o.sets.length}× ${esc(o.naam)}`).join(', ');
    return `
      <div class="routine-card">
        <div class="routine-head">
          <div class="routine-naam">${esc(r.naam)}</div>
          <div class="mini-menu">
            <button class="icon-btn" onclick="bewerkRoutine(${r.id})" title="Bewerken">✎</button>
            <button class="icon-btn" onclick="verwijderRoutine(${r.id})" title="Verwijderen">✕</button>
          </div>
        </div>
        <div class="routine-oefs">${oefs || 'Geen oefeningen'}</div>
        <button class="btn-primary btn-block" onclick="startRoutineWorkout(${r.id})">Start routine</button>
      </div>`;
  }).join('');

  const feed = App.workouts.slice(0, 20).map(w => workoutKaart(w)).join('');
  const dezeWeek = workoutsDezeWeek();

  el.innerHTML = `
    ${W.actief ? `
      <div class="card resume-card" onclick="W.view='actief';renderWorkout()">
        <div><strong>Workout bezig</strong><div class="card-meta">${esc(W.actief.naam)} — tik om verder te gaan</div></div>
        <span class="pulse-dot"></span>
      </div>` : `
      <button class="btn-primary btn-block btn-lg" onclick="startLegeWorkout()">+ Start lege workout</button>`}

    <div class="stats-row" style="margin-top:16px">
      <div class="stat"><div class="stat-label">Deze week</div><div class="stat-value num">${dezeWeek.aantal}</div><div class="stat-sub">workouts</div></div>
      <div class="stat"><div class="stat-label">Volume deze week</div><div class="stat-value num">${dezeWeek.volume.toLocaleString('nl-NL')}</div><div class="stat-sub">kg</div></div>
      <div class="stat"><div class="stat-label">Totaal</div><div class="stat-value num">${App.workouts.length}</div><div class="stat-sub">workouts</div></div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">Mijn routines</div>
        <button class="btn-ghost" onclick="nieuweRoutine()">+ Nieuwe routine</button>
      </div>
      ${App.routines.length ? `<div class="routine-grid">${routinesHtml}</div>`
        : `<div class="empty" style="padding:24px">Nog geen routines. Maak er één, of sla een afgeronde workout op als routine.</div>`}
    </div>

    <div class="section-title">Geschiedenis</div>
    ${feed || `<div class="card"><div class="empty"><div class="empty-icon">🏋</div>Nog geen workouts gelogd.</div></div>`}
  `;
}

function workoutsDezeWeek() {
  const nu = new Date();
  const maandag = new Date(nu);
  maandag.setDate(nu.getDate() - ((nu.getDay() + 6) % 7));
  const cutoff = maandag.toISOString().slice(0, 10);
  const ws = App.workouts.filter(w => w.datum >= cutoff);
  return { aantal: ws.length, volume: ws.reduce((a, w) => a + workoutVolume(w.oefeningen), 0) };
}

function workoutKaart(w) {
  const vol = workoutVolume(w.oefeningen);
  const sets = workoutSets(w.oefeningen);
  const prs = w.prs || [];
  const regels = w.oefeningen.map(o => {
    const werkSets = o.sets.filter(s => s.done !== false && s.type !== 'W');
    const beste = werkSets.filter(s => s.kg != null && s.reps)
      .sort((a, b) => est1RM(b.kg, b.reps) - est1RM(a.kg, a.reps))[0];
    const besteTxt = beste ? `${beste.kg} kg × ${beste.reps}` : '—';
    return `<div class="wo-regel" onclick="openOefeningDetail('${esc(o.naam).replace(/'/g, "\\'")}')">
      <span class="wo-regel-naam">${o.sets.length}× ${esc(o.naam)}</span>
      <span class="wo-regel-best num">${besteTxt}</span>
    </div>`;
  }).join('');

  return `
    <div class="card wo-card">
      <div class="card-header" style="margin-bottom:12px">
        <div>
          <div class="card-title">${esc(w.naam)}</div>
          <div class="card-meta">${relDatum(w.datum)} · ${fmtDuur(w.duur_sec)} · ${vol.toLocaleString('nl-NL')} kg · ${sets} sets</div>
        </div>
        <div class="mini-menu">
          <button class="icon-btn" onclick="herhaalWorkout(${w.id})" title="Opnieuw doen">↻</button>
          <button class="icon-btn" onclick="workoutAlsRoutine(${w.id})" title="Opslaan als routine">☆</button>
          <button class="icon-btn" onclick="verwijderWorkout(${w.id})" title="Verwijderen">✕</button>
        </div>
      </div>
      ${prs.length ? `<div class="pr-badges">${prs.map(p => `<span class="pr-badge">🏆 ${esc(p)}</span>`).join('')}</div>` : ''}
      ${w.notitie ? `<div class="wo-notitie">${esc(w.notitie)}</div>` : ''}
      <div class="wo-regels">${regels}</div>
    </div>`;
}

/* --- workout starten --- */

function startLegeWorkout() {
  W.actief = { startTs: Date.now(), naam: 'Workout', notitie: '', oefeningen: [] };
  W.view = 'actief';
  saveActief();
  renderWorkout();
}

function startRoutineWorkout(id) {
  const r = App.routines.find(x => x.id === id);
  if (!r) return;
  W.actief = {
    startTs: Date.now(), naam: r.naam, notitie: '',
    oefeningen: r.oefeningen.map(o => ({
      naam: o.naam, rustSec: o.rustSec ?? 90,
      sets: o.sets.map(s => ({ type: s.type || 'N', kg: s.kg ?? null, reps: s.reps ?? null, done: false }))
    }))
  };
  W.view = 'actief';
  saveActief();
  renderWorkout();
}

function herhaalWorkout(id) {
  const w = App.workouts.find(x => x.id === id);
  if (!w) return;
  if (W.actief && !confirm('Er is al een workout bezig. Vervangen?')) return;
  W.actief = {
    startTs: Date.now(), naam: w.naam, notitie: '',
    oefeningen: w.oefeningen.map(o => ({
      naam: o.naam, rustSec: o.rustSec ?? 90,
      sets: o.sets.map(s => ({ type: s.type || 'N', kg: s.kg, reps: s.reps, done: false }))
    }))
  };
  W.view = 'actief';
  saveActief();
  switchTab('workout');
}

/* --- actieve workout --- */

function renderActieveWorkout(el) {
  const a = W.actief;
  const oefsHtml = a.oefeningen.map((o, oi) => {
    const vorige = vorigeSets(o.naam);
    const rows = o.sets.map((s, si) => {
      const prev = vorige[si] ? `${vorige[si].kg ?? '—'} × ${vorige[si].reps ?? '—'}` : '—';
      const nr = s.type === 'N' ? (o.sets.slice(0, si + 1).filter(x => x.type !== 'W').length) : s.type;
      return `
        <div class="set-row ${s.done ? 'done' : ''}">
          <button class="set-nr type-${s.type}" onclick="cycleSetType(${oi},${si})" title="${SET_TYPE_LABEL[s.type]}">${nr}</button>
          <div class="set-prev num">${prev}</div>
          <input type="number" inputmode="decimal" step="0.5" class="set-input" placeholder="kg"
            value="${s.kg ?? ''}" oninput="setInput(${oi},${si},'kg',this.value)">
          <input type="number" inputmode="numeric" step="1" class="set-input" placeholder="reps"
            value="${s.reps ?? ''}" oninput="setInput(${oi},${si},'reps',this.value)">
          <button class="set-check ${s.done ? 'on' : ''}" onclick="toggleDone(${oi},${si})">✓</button>
          <button class="set-del" onclick="delSet(${oi},${si})">✕</button>
        </div>`;
    }).join('');

    return `
      <div class="card oef-card">
        <div class="oef-head">
          <div class="oef-naam" onclick="openOefeningDetail('${esc(o.naam).replace(/'/g, "\\'")}')">${esc(o.naam)}</div>
          <div class="mini-menu">
            <select class="rust-select" onchange="setRust(${oi}, this.value)" title="Rusttijd na set">
              ${[0, 30, 60, 90, 120, 150, 180, 240].map(s =>
                `<option value="${s}" ${(o.rustSec ?? 90) === s ? 'selected' : ''}>${s === 0 ? 'geen rust' : 'rust ' + fmtKlok(s)}</option>`).join('')}
            </select>
            <button class="icon-btn" onclick="delOefening(${oi})" title="Oefening verwijderen">✕</button>
          </div>
        </div>
        <div class="set-header">
          <span>Set</span><span>Vorige</span><span>Kg</span><span>Reps</span><span></span><span></span>
        </div>
        ${rows}
        <button class="btn-ghost btn-block" onclick="addSet(${oi})">+ Set toevoegen</button>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="actief-top">
      <div>
        <input class="wo-naam-input" value="${esc(a.naam)}" oninput="W.actief.naam=this.value;saveActief()">
        <div class="card-meta"><span id="woDuur">${fmtKlok(Math.floor((Date.now() - a.startTs) / 1000))}</span> · ${workoutVolume(a.oefeningen).toLocaleString('nl-NL')} kg · ${workoutSets(a.oefeningen)} sets</div>
      </div>
      <button class="btn-primary" onclick="openFinish()">Afronden</button>
    </div>
    ${oefsHtml || `<div class="card"><div class="empty">Voeg je eerste oefening toe.</div></div>`}
    <button class="btn-ghost btn-block" onclick="openPicker('actief')">+ Oefening toevoegen</button>
    <button class="btn-danger btn-block" style="margin-top:10px" onclick="annuleerWorkout()">Workout annuleren</button>
  `;

  startTicker();
}

function startTicker() {
  if (W.tick) clearInterval(W.tick);
  W.tick = setInterval(() => {
    const elDuur = document.getElementById('woDuur');
    if (elDuur && W.actief) elDuur.textContent = fmtKlok(Math.floor((Date.now() - W.actief.startTs) / 1000));
    renderRustBar();
  }, 1000);
}

function setInput(oi, si, veld, val) {
  W.actief.oefeningen[oi].sets[si][veld] = val === '' ? null : parseFloat(val);
  saveActief();
}

function toggleDone(oi, si) {
  const s = W.actief.oefeningen[oi].sets[si];
  s.done = !s.done;
  saveActief();
  if (s.done) {
    const rust = W.actief.oefeningen[oi].rustSec ?? 90;
    if (rust > 0) startRust(rust);
  }
  renderWorkout();
}

function cycleSetType(oi, si) {
  const s = W.actief.oefeningen[oi].sets[si];
  s.type = SET_TYPES[(SET_TYPES.indexOf(s.type) + 1) % SET_TYPES.length];
  saveActief();
  renderWorkout();
}

function addSet(oi) {
  const sets = W.actief.oefeningen[oi].sets;
  const laatste = sets[sets.length - 1];
  sets.push({ type: 'N', kg: laatste?.kg ?? null, reps: laatste?.reps ?? null, done: false });
  saveActief();
  renderWorkout();
}

function delSet(oi, si) {
  W.actief.oefeningen[oi].sets.splice(si, 1);
  saveActief();
  renderWorkout();
}

function delOefening(oi) {
  if (!confirm(`${W.actief.oefeningen[oi].naam} verwijderen uit deze workout?`)) return;
  W.actief.oefeningen.splice(oi, 1);
  saveActief();
  renderWorkout();
}

function setRust(oi, val) {
  W.actief.oefeningen[oi].rustSec = parseInt(val);
  saveActief();
}

/* --- rusttimer --- */

function startRust(sec) {
  W.rust = { eind: Date.now() + sec * 1000, totaal: sec };
  renderRustBar();
}

function plusRust(sec) {
  if (W.rust) { W.rust.eind += sec * 1000; W.rust.totaal += sec; renderRustBar(); }
}

function stopRust() {
  W.rust = null;
  renderRustBar();
}

function renderRustBar() {
  const bar = document.getElementById('rustBar');
  if (!bar) return;
  if (!W.rust) { bar.style.display = 'none'; return; }
  const over = Math.ceil((W.rust.eind - Date.now()) / 1000);
  if (over <= 0) {
    bar.style.display = 'none';
    W.rust = null;
    piep();
    return;
  }
  bar.style.display = 'flex';
  document.getElementById('rustTijd').textContent = fmtKlok(over);
  document.getElementById('rustFill').style.width = `${(over / W.rust.totaal) * 100}%`;
}

function piep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; g.gain.value = 0.15;
    o.start(); o.stop(ctx.currentTime + 0.4);
  } catch (e) {}
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

/* --- afronden --- */

function openFinish() {
  const sets = workoutSets(W.actief.oefeningen);
  if (!sets && !confirm('Er zijn geen afgevinkte sets. Toch afronden?')) return;
  document.getElementById('finishNaam').value = W.actief.naam;
  document.getElementById('finishNotitie').value = W.actief.notitie || '';
  document.getElementById('finishDatum').value = vandaagStr();
  document.getElementById('finishOverlay').classList.add('open');
}

function detecteerPRs(oefeningen) {
  const prs = [];
  for (const o of oefeningen) {
    const rec = records(o.naam);
    for (const s of o.sets) {
      if (!s.done || s.type === 'W' || s.kg == null || !s.reps) continue;
      if (!rec.maxKg || s.kg > rec.maxKg.kg) { prs.push(`${o.naam}: ${s.kg} kg`); break; }
      if (rec.best1 && est1RM(s.kg, s.reps) > rec.best1.val) { prs.push(`${o.naam}: 1RM ${est1RM(s.kg, s.reps).toFixed(1)} kg`); break; }
    }
  }
  return prs;
}

async function saveWorkout() {
  const a = W.actief;
  a.naam = document.getElementById('finishNaam').value.trim() || 'Workout';
  a.notitie = document.getElementById('finishNotitie').value.trim();
  const datum = document.getElementById('finishDatum').value || vandaagStr();
  const duur = Math.floor((Date.now() - a.startTs) / 1000);

  const oefeningen = a.oefeningen
    .map(o => ({ naam: o.naam, rustSec: o.rustSec ?? 90, sets: o.sets.filter(s => s.done) }))
    .filter(o => o.sets.length);
  const prs = detecteerPRs(oefeningen);

  const btn = document.getElementById('btnSaveWorkout');
  btn.disabled = true; btn.textContent = 'Opslaan…';
  try {
    await turso([ex('INSERT INTO workouts (datum, naam, duur_sec, notitie, data) VALUES (?,?,?,?,?)',
      [arg(datum), arg(a.naam), arg(duur), arg(a.notitie || null), arg(JSON.stringify(oefeningen))])]);
    W.actief = null;
    W.rust = null;
    saveActief();
    closeModal('finishOverlay');
    await loadAll();
    if (App.workouts.length && prs.length) App.workouts[0].prs = prs;
    W.view = 'overzicht';
    renderActiveTab();
    if (prs.length) setTimeout(() => alert('🏆 Nieuwe records!\n\n' + prs.join('\n')), 100);
  } catch (e) { alert('Fout: ' + e.message); }
  finally { btn.disabled = false; btn.textContent = 'Opslaan'; }
}

function annuleerWorkout() {
  if (!confirm('Workout annuleren? Alle ingevoerde sets gaan verloren.')) return;
  W.actief = null;
  W.rust = null;
  saveActief();
  W.view = 'overzicht';
  renderWorkout();
}

async function verwijderWorkout(id) {
  if (!confirm('Deze workout definitief verwijderen?')) return;
  try {
    await turso([ex('DELETE FROM workouts WHERE id = ?', [arg(id)])]);
    await loadAll(); renderActiveTab();
  } catch (e) { alert('Fout: ' + e.message); }
}

/* --- routines --- */

function nieuweRoutine() {
  W.editRoutine = { id: null, naam: '', oefeningen: [] };
  W.view = 'routine';
  renderWorkout();
}

function bewerkRoutine(id) {
  const r = App.routines.find(x => x.id === id);
  if (!r) return;
  W.editRoutine = JSON.parse(JSON.stringify(r));
  W.view = 'routine';
  renderWorkout();
}

async function workoutAlsRoutine(id) {
  const w = App.workouts.find(x => x.id === id);
  if (!w) return;
  const naam = prompt('Naam voor de routine:', w.naam);
  if (!naam) return;
  const oefeningen = w.oefeningen.map(o => ({
    naam: o.naam, rustSec: o.rustSec ?? 90,
    sets: o.sets.map(s => ({ type: s.type || 'N', kg: s.kg, reps: s.reps }))
  }));
  try {
    await turso([ex('INSERT INTO routines (naam, data) VALUES (?,?)', [arg(naam), arg(JSON.stringify(oefeningen))])]);
    await loadAll(); renderActiveTab();
  } catch (e) { alert('Fout: ' + e.message); }
}

function renderRoutineEditor(el) {
  const r = W.editRoutine;
  const oefsHtml = r.oefeningen.map((o, oi) => {
    const rows = o.sets.map((s, si) => `
      <div class="set-row">
        <button class="set-nr type-${s.type || 'N'}" onclick="rCycleType(${oi},${si})">${s.type === 'W' || s.type === 'F' || s.type === 'D' ? s.type : si + 1}</button>
        <div class="set-prev"></div>
        <input type="number" inputmode="decimal" step="0.5" class="set-input" placeholder="kg" value="${s.kg ?? ''}" oninput="rSetInput(${oi},${si},'kg',this.value)">
        <input type="number" inputmode="numeric" class="set-input" placeholder="reps" value="${s.reps ?? ''}" oninput="rSetInput(${oi},${si},'reps',this.value)">
        <span></span>
        <button class="set-del" onclick="rDelSet(${oi},${si})">✕</button>
      </div>`).join('');
    return `
      <div class="card oef-card">
        <div class="oef-head">
          <div class="oef-naam">${esc(o.naam)}</div>
          <div class="mini-menu">
            <select class="rust-select" onchange="W.editRoutine.oefeningen[${oi}].rustSec=parseInt(this.value)">
              ${[0, 30, 60, 90, 120, 150, 180, 240].map(s =>
                `<option value="${s}" ${(o.rustSec ?? 90) === s ? 'selected' : ''}>${s === 0 ? 'geen rust' : 'rust ' + fmtKlok(s)}</option>`).join('')}
            </select>
            <button class="icon-btn" onclick="W.editRoutine.oefeningen.splice(${oi},1);renderWorkout()">✕</button>
          </div>
        </div>
        <div class="set-header"><span>Set</span><span></span><span>Kg</span><span>Reps</span><span></span><span></span></div>
        ${rows}
        <button class="btn-ghost btn-block" onclick="rAddSet(${oi})">+ Set toevoegen</button>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="actief-top">
      <input class="wo-naam-input" placeholder="Naam routine" value="${esc(r.naam)}" oninput="W.editRoutine.naam=this.value">
      <div style="display:flex;gap:8px">
        <button class="btn-ghost" onclick="W.view='overzicht';W.editRoutine=null;renderWorkout()">Annuleren</button>
        <button class="btn-primary" onclick="saveRoutine()">Opslaan</button>
      </div>
    </div>
    ${oefsHtml || `<div class="card"><div class="empty">Voeg oefeningen toe aan deze routine.</div></div>`}
    <button class="btn-ghost btn-block" onclick="openPicker('routine')">+ Oefening toevoegen</button>
  `;
}

function rSetInput(oi, si, veld, val) {
  W.editRoutine.oefeningen[oi].sets[si][veld] = val === '' ? null : parseFloat(val);
}

function rCycleType(oi, si) {
  const s = W.editRoutine.oefeningen[oi].sets[si];
  s.type = SET_TYPES[(SET_TYPES.indexOf(s.type || 'N') + 1) % SET_TYPES.length];
  renderWorkout();
}

function rAddSet(oi) {
  const sets = W.editRoutine.oefeningen[oi].sets;
  const laatste = sets[sets.length - 1];
  sets.push({ type: 'N', kg: laatste?.kg ?? null, reps: laatste?.reps ?? null });
  renderWorkout();
}

function rDelSet(oi, si) {
  W.editRoutine.oefeningen[oi].sets.splice(si, 1);
  renderWorkout();
}

async function saveRoutine() {
  const r = W.editRoutine;
  if (!r.naam.trim()) { alert('Geef de routine een naam.'); return; }
  if (!r.oefeningen.length) { alert('Voeg minstens één oefening toe.'); return; }
  try {
    if (r.id) {
      await turso([ex('UPDATE routines SET naam = ?, data = ? WHERE id = ?',
        [arg(r.naam.trim()), arg(JSON.stringify(r.oefeningen)), arg(r.id)])]);
    } else {
      await turso([ex('INSERT INTO routines (naam, data) VALUES (?,?)',
        [arg(r.naam.trim()), arg(JSON.stringify(r.oefeningen))])]);
    }
    W.editRoutine = null;
    W.view = 'overzicht';
    await loadAll(); renderActiveTab();
  } catch (e) { alert('Fout: ' + e.message); }
}

async function verwijderRoutine(id) {
  const r = App.routines.find(x => x.id === id);
  if (!confirm(`Routine "${r?.naam}" verwijderen?`)) return;
  try {
    await turso([ex('DELETE FROM routines WHERE id = ?', [arg(id)])]);
    await loadAll(); renderActiveTab();
  } catch (e) { alert('Fout: ' + e.message); }
}

/* --- oefening-picker --- */

function openPicker(doel) {
  W.pickerDoel = doel;
  W.pickerZoek = '';
  W.pickerSpier = '';
  W.pickerSelectie = [];
  document.getElementById('pickerZoek').value = '';
  renderPickerLijst();
  document.getElementById('pickerOverlay').classList.add('open');
  setTimeout(() => document.getElementById('pickerZoek').focus(), 50);
}

function pickerFilter(zoek) {
  W.pickerZoek = zoek.toLowerCase();
  renderPickerLijst();
}

function pickerSpier(sp) {
  W.pickerSpier = W.pickerSpier === sp ? '' : sp;
  renderPickerLijst();
}

function renderPickerLijst() {
  const chips = SPIERGROEPEN.map(sp =>
    `<button class="chip ${W.pickerSpier === sp ? 'active' : ''}" onclick="pickerSpier('${sp}')">${sp}</button>`).join('');
  document.getElementById('pickerChips').innerHTML = chips;

  const lijst = alleOefeningen()
    .filter(o => (!W.pickerSpier || o.spier === W.pickerSpier) &&
                 (!W.pickerZoek || o.naam.toLowerCase().includes(W.pickerZoek)))
    .sort((a, b) => a.naam.localeCompare(b.naam));

  document.getElementById('pickerLijst').innerHTML = lijst.map(o => {
    const sel = W.pickerSelectie.includes(o.naam);
    const nm = esc(o.naam).replace(/'/g, "\\'");
    return `<div class="picker-item ${sel ? 'sel' : ''}" onclick="pickerToggle('${nm}')">
      <div>
        <div class="picker-naam">${esc(o.naam)}${o.eigen ? ' <span class="eigen-tag">eigen</span>' : ''}</div>
        <div class="picker-sub">${o.spier} · ${o.mat}</div>
      </div>
      <span class="picker-check">${sel ? '✓' : ''}</span>
    </div>`;
  }).join('') || `<div class="empty" style="padding:24px">Geen oefeningen gevonden.</div>`;

  const btn = document.getElementById('btnPickerVoegToe');
  btn.textContent = W.pickerSelectie.length ? `Voeg ${W.pickerSelectie.length} toe` : 'Voeg toe';
  btn.disabled = !W.pickerSelectie.length;
}

function pickerToggle(naam) {
  const i = W.pickerSelectie.indexOf(naam);
  if (i >= 0) W.pickerSelectie.splice(i, 1); else W.pickerSelectie.push(naam);
  renderPickerLijst();
}

function pickerVoegToe() {
  const doelLijst = W.pickerDoel === 'routine' ? W.editRoutine.oefeningen : W.actief.oefeningen;
  for (const naam of W.pickerSelectie) {
    doelLijst.push({
      naam, rustSec: 90,
      sets: [{ type: 'N', kg: null, reps: null, ...(W.pickerDoel === 'actief' ? { done: false } : {}) }]
    });
  }
  if (W.pickerDoel === 'actief') saveActief();
  closeModal('pickerOverlay');
  renderWorkout();
}

/* --- eigen oefening --- */

function openEigenOefening() {
  document.getElementById('eoNaam').value = '';
  document.getElementById('eoSpier').value = 'Borst';
  document.getElementById('eoMat').value = 'Barbell';
  document.getElementById('eigenOefOverlay').classList.add('open');
}

async function saveEigenOefening() {
  const naam = document.getElementById('eoNaam').value.trim();
  if (!naam) { alert('Vul een naam in.'); return; }
  const spier = document.getElementById('eoSpier').value;
  const mat = document.getElementById('eoMat').value;
  try {
    await turso([ex('INSERT INTO eigen_oefeningen (naam, spiergroep, materiaal) VALUES (?,?,?)',
      [arg(naam), arg(spier), arg(mat)])]);
    await loadAll();
    closeModal('eigenOefOverlay');
    renderPickerLijst();
  } catch (e) { alert('Fout: ' + e.message); }
}

/* --- oefening-detail --- */

function openOefeningDetail(naam) {
  const rec = records(naam);
  const hist = oefeningHistorie(naam);
  const info = zoekOefening(naam);

  document.getElementById('odTitel').textContent = naam;
  document.getElementById('odSub').textContent = `${info.spier} · ${info.mat}`;
  document.getElementById('odRecords').innerHTML = `
    <div class="stat"><div class="stat-label">Max gewicht</div><div class="stat-value num">${rec.maxKg ? rec.maxKg.kg + ' kg' : '—'}</div><div class="stat-sub">${rec.maxKg ? '× ' + rec.maxKg.reps + ' · ' + fmt(rec.maxKg.datum) : ''}</div></div>
    <div class="stat"><div class="stat-label">Beste 1RM (schatting)</div><div class="stat-value num">${rec.best1 ? rec.best1.val.toFixed(1) + ' kg' : '—'}</div><div class="stat-sub">${rec.best1 ? rec.best1.kg + ' kg × ' + rec.best1.reps : ''}</div></div>
    <div class="stat"><div class="stat-label">Beste set-volume</div><div class="stat-value num">${rec.maxVol ? rec.maxVol.vol.toLocaleString('nl-NL') + ' kg' : '—'}</div><div class="stat-sub">${rec.maxVol ? rec.maxVol.kg + ' kg × ' + rec.maxVol.reps : ''}</div></div>
    <div class="stat"><div class="stat-label">Werk-sets totaal</div><div class="stat-value num">${rec.totSets}</div><div class="stat-sub">${hist.length} sessies</div></div>`;

  document.getElementById('odHistorie').innerHTML = [...hist].reverse().slice(0, 10).map(h => `
    <div class="od-sessie">
      <div class="od-datum">${relDatum(h.datum)}</div>
      <div class="od-sets num">${h.sets.map(s => `${s.kg} × ${s.reps}`).join(' · ')}</div>
    </div>`).join('') || '<div class="empty" style="padding:16px">Nog niet gedaan.</div>';

  document.getElementById('oefDetailOverlay').classList.add('open');

  if (W.detailChart) { W.detailChart.destroy(); W.detailChart = null; }
  if (hist.length >= 2) {
    document.getElementById('odChartWrap').style.display = 'block';
    const punten = hist.map(h => ({
      datum: h.datum,
      best: Math.max(...h.sets.map(s => est1RM(s.kg, s.reps)))
    }));
    W.detailChart = new Chart(document.getElementById('odChart'), {
      type: 'line',
      data: {
        labels: punten.map(p => fmt(p.datum)),
        datasets: [{
          label: '1RM (schatting)',
          data: punten.map(p => +p.best.toFixed(1)),
          borderColor: '#2d9a6a',
          backgroundColor: 'rgba(45,154,106,0.08)',
          tension: 0.3, fill: true, pointRadius: 3, borderWidth: 2
        }]
      },
      options: chartOpts()
    });
  } else {
    document.getElementById('odChartWrap').style.display = 'none';
  }
}
