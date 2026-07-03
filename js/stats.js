/* Statistieken: jaarkalender, totalen, weekvolume, spiergroepen, trend per oefening */

const ST = { jaar: new Date().getFullYear(), oefening: null, charts: {} };

const MAANDEN_KORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

function openStats() {
  W.view = 'stats';
  renderWorkout();
}

function statsJaar(delta) {
  ST.jaar += delta;
  renderWorkout();
}

/* ---------- helpers ---------- */

function maandagVan(dstr) {
  const d = new Date(dstr + 'T12:00');
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function weekStreaks() {
  const mondays = new Set(App.workouts.map(w => maandagVan(w.datum)));
  const sorted = [...mondays].sort();
  let langste = 0, run = 0, prev = null;
  for (const m of sorted) {
    run = (prev && (new Date(m) - new Date(prev)) === 7 * 86400000) ? run + 1 : 1;
    langste = Math.max(langste, run);
    prev = m;
  }
  let huidige = 0;
  let wk = maandagVan(vandaagStr());
  if (!mondays.has(wk)) wk = new Date(new Date(wk + 'T12:00').getTime() - 7 * 86400000).toISOString().slice(0, 10);
  while (mondays.has(wk)) {
    huidige++;
    wk = new Date(new Date(wk + 'T12:00').getTime() - 7 * 86400000).toISOString().slice(0, 10);
  }
  return { langste, huidige };
}

function statsOefeningLijst() {
  const telling = new Map();
  for (const w of App.workouts) for (const o of w.oefeningen) {
    telling.set(o.naam, (telling.get(o.naam) || 0) + 1);
  }
  return [...telling.entries()].sort((a, b) => b[1] - a[1]).map(([naam, n]) => ({ naam, n }));
}

/* ---------- jaarkalender ---------- */

function bouwJaarKalender(jaar, ws) {
  const dagInfo = new Map();
  for (const w of ws) {
    const cur = dagInfo.get(w.datum) || { n: 0, vol: 0 };
    cur.n++;
    cur.vol += workoutVolume(w.oefeningen);
    dagInfo.set(w.datum, cur);
  }
  const vols = [...dagInfo.values()].map(d => d.vol).sort((a, b) => a - b);
  const q = p => vols.length ? vols[Math.min(vols.length - 1, Math.floor(p * vols.length))] : 0;
  const lvl = v => v <= 0 ? 1 : v <= q(0.25) ? 1 : v <= q(0.5) ? 2 : v <= q(0.75) ? 3 : 4;

  let html = '';
  for (let m = 0; m < 12; m++) {
    const dagen = new Date(jaar, m + 1, 0).getDate();
    const offset = (new Date(jaar, m, 1).getDay() + 6) % 7;
    let cells = '';
    for (let i = 0; i < offset; i++) cells += '<span class="cal-dag leeg"></span>';
    for (let d = 1; d <= dagen; d++) {
      const key = `${jaar}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const info = dagInfo.get(key);
      const titel = info
        ? `${d} ${MAANDEN_KORT[m]} — ${info.n} workout${info.n > 1 ? 's' : ''}, ${info.vol.toLocaleString('nl-NL')} kg`
        : `${d} ${MAANDEN_KORT[m]}`;
      cells += `<span class="cal-dag lvl${info ? lvl(info.vol) : 0}${key === vandaagStr() ? ' vandaag' : ''}" title="${titel}"></span>`;
    }
    html += `<div class="cal-maand"><div class="cal-maand-naam">${MAANDEN_KORT[m]}</div><div class="cal-dagen">${cells}</div></div>`;
  }
  return html;
}

/* ---------- hoofdweergave ---------- */

function renderStats(el) {
  const jaar = ST.jaar;
  const ws = App.workouts.filter(w => w.datum.startsWith(String(jaar)));

  const jTot = { vol: 0, sets: 0, duur: 0 };
  for (const w of ws) {
    jTot.vol += workoutVolume(w.oefeningen);
    jTot.sets += workoutSets(w.oefeningen);
    jTot.duur += w.duur_sec;
  }

  const aTot = { vol: 0, sets: 0, duur: 0 };
  for (const w of App.workouts) {
    aTot.vol += workoutVolume(w.oefeningen);
    aTot.sets += workoutSets(w.oefeningen);
    aTot.duur += w.duur_sec;
  }
  const streaks = weekStreaks();
  const actieveDagen = new Set(ws.map(w => w.datum)).size;

  const oefLijst = statsOefeningLijst();
  if (!ST.oefening || !oefLijst.some(o => o.naam === ST.oefening)) ST.oefening = oefLijst[0]?.naam || null;

  el.innerHTML = `
    <div class="actief-top">
      <div>
        <div class="home-groet-titel" style="font-size:1.2rem">Statistieken</div>
        <div class="card-meta">Alles over je workouts</div>
      </div>
      <button class="btn-ghost" onclick="W.view='overzicht';renderWorkout()">‹ Terug</button>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">Jaarkalender</div>
        <div class="datum-nav" style="margin:0">
          <button class="icon-btn" onclick="statsJaar(-1)">‹</button>
          <div class="datum-nav-label" style="min-width:60px">${jaar}</div>
          <button class="icon-btn" onclick="statsJaar(1)">›</button>
        </div>
      </div>
      <div class="cal-grid">${bouwJaarKalender(jaar, ws)}</div>
      <div class="cal-legenda">
        <span>minder</span>
        <span class="cal-dag lvl0"></span><span class="cal-dag lvl1"></span><span class="cal-dag lvl2"></span><span class="cal-dag lvl3"></span><span class="cal-dag lvl4"></span>
        <span>meer</span>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat"><div class="stat-label">Workouts ${jaar}</div><div class="stat-value num">${ws.length}</div><div class="stat-sub">${actieveDagen} actieve dagen</div></div>
      <div class="stat"><div class="stat-label">Volume ${jaar}</div><div class="stat-value num">${jTot.vol.toLocaleString('nl-NL')}</div><div class="stat-sub">kg getild</div></div>
      <div class="stat"><div class="stat-label">Sets ${jaar}</div><div class="stat-value num">${jTot.sets.toLocaleString('nl-NL')}</div><div class="stat-sub">afgevinkt</div></div>
      <div class="stat"><div class="stat-label">Trainingstijd ${jaar}</div><div class="stat-value num">${fmtDuur(jTot.duur)}</div><div class="stat-sub">${ws.length ? 'gem. ' + fmtDuur(jTot.duur / ws.length) + ' per workout' : ''}</div></div>
    </div>

    <div class="stats-row">
      <div class="stat"><div class="stat-label">Huidige reeks</div><div class="stat-value num">${streaks.huidige}</div><div class="stat-sub">weken op rij</div></div>
      <div class="stat"><div class="stat-label">Langste reeks</div><div class="stat-value num">${streaks.langste}</div><div class="stat-sub">weken op rij</div></div>
      <div class="stat"><div class="stat-label">Totaal ooit</div><div class="stat-value num">${App.workouts.length}</div><div class="stat-sub">workouts</div></div>
      <div class="stat"><div class="stat-label">Volume ooit</div><div class="stat-value num">${aTot.vol.toLocaleString('nl-NL')}</div><div class="stat-sub">kg getild</div></div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Volume per week</div>
          <div class="card-meta">${jaar}</div>
        </div>
      </div>
      <div class="chart-wrap" style="height:220px"><canvas id="stVolumeChart"></canvas></div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Workouts per maand</div>
          <div class="card-meta">${jaar}</div>
        </div>
      </div>
      <div class="chart-wrap" style="height:200px"><canvas id="stMaandChart"></canvas></div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Sets per spiergroep</div>
          <div class="card-meta">${jaar}</div>
        </div>
      </div>
      <div class="chart-wrap" style="height:220px"><canvas id="stSpierChart"></canvas></div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Trend per oefening</div>
          <div class="card-meta">zwaarste set en geschat 1RM per sessie (alle jaren)</div>
        </div>
        <select class="stat-select" onchange="ST.oefening=this.value;renderTrendChart()">
          ${oefLijst.map(o => `<option value="${esc(o.naam)}" ${o.naam === ST.oefening ? 'selected' : ''}>${esc(o.naam)} (${o.n}×)</option>`).join('')}
        </select>
      </div>
      <div class="chart-wrap" style="height:240px"><canvas id="stTrendChart"></canvas></div>
      <div id="stTrendLeeg" class="empty" style="display:none;padding:20px">Nog geen sessies met gewichten voor deze oefening.</div>
    </div>
  `;

  renderStatsCharts(ws, jaar);
}

/* ---------- grafieken ---------- */

function vernietigStCharts() {
  for (const k of Object.keys(ST.charts)) {
    ST.charts[k]?.destroy();
    delete ST.charts[k];
  }
}

function renderStatsCharts(ws, jaar) {
  vernietigStCharts();
  const opts = chartOpts();
  opts.plugins.legend.display = false;

  /* volume per week */
  const isHuidigJaar = jaar === new Date().getFullYear();
  const laatsteWeek = isHuidigJaar
    ? Math.ceil((new Date() - new Date(jaar, 0, 1)) / (7 * 86400000))
    : 53;
  const wkVol = new Array(laatsteWeek).fill(0);
  for (const w of ws) {
    const idx = Math.min(laatsteWeek - 1, Math.floor((new Date(w.datum + 'T12:00') - new Date(jaar, 0, 1)) / (7 * 86400000)));
    wkVol[idx] += workoutVolume(w.oefeningen);
  }
  ST.charts.vol = new Chart(document.getElementById('stVolumeChart'), {
    type: 'bar',
    data: {
      labels: wkVol.map((_, i) => 'w' + (i + 1)),
      datasets: [{ data: wkVol, backgroundColor: 'rgba(45,154,106,0.65)', borderRadius: 4 }]
    },
    options: { ...opts, scales: { ...opts.scales, x: { ...opts.scales.x, ticks: { ...opts.scales.x.ticks, maxTicksLimit: 12 } } } }
  });

  /* workouts per maand */
  const mnd = new Array(12).fill(0);
  for (const w of ws) mnd[parseInt(w.datum.slice(5, 7)) - 1]++;
  ST.charts.mnd = new Chart(document.getElementById('stMaandChart'), {
    type: 'bar',
    data: {
      labels: MAANDEN_KORT,
      datasets: [{ data: mnd, backgroundColor: 'rgba(74,122,155,0.65)', borderRadius: 4 }]
    },
    options: { ...opts, scales: { ...opts.scales, y: { ...opts.scales.y, ticks: { ...opts.scales.y.ticks, precision: 0 } } } }
  });

  /* sets per spiergroep */
  const spier = new Map();
  for (const w of ws) for (const o of w.oefeningen) {
    const sp = zoekOefening(o.naam).spier;
    const n = o.sets.filter(s => s.done !== false && s.type !== 'W').length;
    if (n) spier.set(sp, (spier.get(sp) || 0) + n);
  }
  const spierSorted = [...spier.entries()].sort((a, b) => b[1] - a[1]);
  ST.charts.spier = new Chart(document.getElementById('stSpierChart'), {
    type: 'bar',
    data: {
      labels: spierSorted.map(e => e[0]),
      datasets: [{ data: spierSorted.map(e => e[1]), backgroundColor: 'rgba(196,122,46,0.65)', borderRadius: 4 }]
    },
    options: { ...opts, indexAxis: 'y' }
  });

  renderTrendChart();
}

function renderTrendChart() {
  ST.charts.trend?.destroy();
  delete ST.charts.trend;
  const canvas = document.getElementById('stTrendChart');
  const leeg = document.getElementById('stTrendLeeg');
  if (!canvas || !ST.oefening) return;

  const hist = oefeningHistorie(ST.oefening);
  const punten = hist.map(h => ({
    datum: h.datum,
    top: Math.max(...h.sets.map(s => s.kg)),
    rm: Math.max(...h.sets.map(s => est1RM(s.kg, s.reps)))
  })).filter(p => isFinite(p.top));

  if (!punten.length) {
    canvas.parentElement.style.display = 'none';
    leeg.style.display = 'block';
    return;
  }
  canvas.parentElement.style.display = 'block';
  leeg.style.display = 'none';

  ST.charts.trend = new Chart(canvas, {
    type: 'line',
    data: {
      labels: punten.map(p => fmt(p.datum)),
      datasets: [
        {
          label: 'Zwaarste set (kg)',
          data: punten.map(p => p.top),
          borderColor: '#2d9a6a',
          backgroundColor: 'rgba(45,154,106,0.08)',
          tension: 0.3, fill: true, pointRadius: 3, borderWidth: 2
        },
        {
          label: 'Geschat 1RM (kg)',
          data: punten.map(p => +p.rm.toFixed(1)),
          borderColor: '#c47a2e',
          backgroundColor: 'transparent',
          borderDash: [6, 4],
          tension: 0.3, pointRadius: 0, borderWidth: 2
        }
      ]
    },
    options: chartOpts()
  });
}
