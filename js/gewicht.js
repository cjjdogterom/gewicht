/* Gewicht-module: metingen, doellijn, grafiek */

let filterDays = 0, weightChart;

function doelGewicht(datumStr) {
  const s  = getS();
  const t0 = new Date(s.beginDatum).getTime();
  const t1 = new Date(s.eindDatum).getTime();
  const t  = new Date(datumStr).getTime();
  const pct = (t - t0) / (t1 - t0);
  return +(s.beginGewicht + pct * (s.streefGewicht - s.beginGewicht)).toFixed(2);
}

/* Voorspelling: lineaire trend over de laatste 28 dagen met metingen */
function berekenTrend() {
  if (App.metingen.length < 3) return null;
  const laatste = App.metingen[App.metingen.length - 1];
  const t1 = new Date(laatste.datum).getTime();
  const cutoff = t1 - 28 * 86400000;
  const punten = App.metingen
    .filter(m => new Date(m.datum).getTime() >= cutoff)
    .map(m => ({ x: (new Date(m.datum).getTime() - t1) / 86400000, y: m.gewicht }));
  if (punten.length < 3) return null;
  const n = punten.length;
  const sx = punten.reduce((a, p) => a + p.x, 0);
  const sy = punten.reduce((a, p) => a + p.y, 0);
  const sxx = punten.reduce((a, p) => a + p.x * p.x, 0);
  const sxy = punten.reduce((a, p) => a + p.x * p.y, 0);
  const noemer = n * sxx - sx * sx;
  if (!noemer) return null;
  const helling = (n * sxy - sx * sy) / noemer;      // kg per dag
  const basis = (sy - helling * sx) / n;              // gewicht op dag 0 (laatste meting)
  return { helling, basis, vanafDatum: laatste.datum };
}

function voorspelGewicht(datumStr, trend) {
  const dagen = (new Date(datumStr) - new Date(trend.vanafDatum)) / 86400000;
  if (dagen < 0) return null;
  return +(trend.basis + trend.helling * dagen).toFixed(2);
}

/* Verwachte datum waarop het streefgewicht wordt bereikt */
function voorspelDoelDatum(trend) {
  const s = getS();
  const teGaan = s.streefGewicht - trend.basis;
  if (trend.helling >= 0 || teGaan >= 0) return null;   // niet op koers of doel al bereikt
  const dagen = teGaan / trend.helling;
  if (dagen > 730) return null;                          // meer dan 2 jaar: niet zinvol
  const d = new Date(new Date(trend.vanafDatum).getTime() + dagen * 86400000);
  return d.toISOString().slice(0, 10);
}

function setFilter(days) {
  filterDays = days;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.days) === days));
  renderGewichtChart();
  renderGewichtTable();
}

function renderGewicht() {
  const el = document.getElementById('view-gewicht');
  if (!App.metingen.length) {
    el.innerHTML = `
      <div class="card">
        <div class="empty">
          <div class="empty-icon">⚖</div>
          Nog geen metingen.<br> Klik op <strong>+ Meting</strong> om te beginnen.
        </div>
      </div>
      <button class="btn-primary btn-block" onclick="openMeting()">+ Meting toevoegen</button>`;
    return;
  }
  const s = getS();
  const last = App.metingen[App.metingen.length - 1];
  const eerste = App.metingen[0];
  const verloren = +(eerste.gewicht - last.gewicht).toFixed(1);
  const nodig = +(last.gewicht - s.streefGewicht).toFixed(1);
  const dagenOver = Math.max(0, Math.ceil((new Date(s.eindDatum) - new Date()) / 86400000));
  const tdee = s.bmr + s.eat + s.neat + s.tef;
  const gems = App.metingen.slice(-7).reduce((a, d) => a + d.gewicht, 0) / Math.min(7, App.metingen.length);
  const doelVandaag = doelGewicht(vandaagStr());
  const opSchema = last.gewicht - doelVandaag;

  const gwPct  = Math.max(0, Math.min(100, ((s.beginGewicht - last.gewicht) / (s.beginGewicht - s.streefGewicht)) * 100));
  const vetPct = last.vet_perc ? Math.max(0, Math.min(100, ((s.beginVet - last.vet_perc) / (s.beginVet - s.doelVet)) * 100)) : 0;
  const tijdPct = Math.max(0, Math.min(100, ((new Date() - new Date(s.beginDatum)) / (new Date(s.eindDatum) - new Date(s.beginDatum))) * 100));

  const schemaTekst = opSchema <= 0
    ? `<span class="ahead">${Math.abs(opSchema).toFixed(1)} kg vóór schema</span>`
    : `<span class="behind">${opSchema.toFixed(1)} kg achter schema</span>`;

  const trend = berekenTrend();
  let voorspellingTiles = '';
  if (trend) {
    const perWeek = trend.helling * 7;
    const opEind = voorspelGewicht(s.eindDatum, trend);
    const doelDatum = voorspelDoelDatum(trend);
    voorspellingTiles = `
      <div class="stat"><div class="stat-label">Trend</div><div class="stat-value num">${perWeek <= 0 ? '−' : '+'}${Math.abs(perWeek).toFixed(2)} kg</div><div class="stat-sub">per week (laatste 28 dagen)</div></div>
      <div class="stat"><div class="stat-label">Verwacht op einddatum</div><div class="stat-value num">${opEind != null ? opEind.toFixed(1) + ' kg' : '—'}</div><div class="stat-sub">bij huidige trend</div></div>
      <div class="stat"><div class="stat-label">Doel bereikt rond</div><div class="stat-value num" style="font-size:1.05rem">${doelDatum ? fmt(doelDatum) : '—'}</div><div class="stat-sub">${doelDatum ? (doelDatum <= s.eindDatum ? 'vóór je einddatum ✓' : 'na je einddatum') : 'niet op koers bij huidige trend'}</div></div>`;
  }

  el.innerHTML = `
    <div class="hero">
      <div class="hero-main">
        <div class="hero-label">Huidig gewicht</div>
        <div class="hero-value num">${last.gewicht.toFixed(1)} <span class="unit">kg</span></div>
        <div class="hero-sub"><span class="hero-date">${fmt(last.datum)}</span><span class="hero-sep">·</span><span class="hero-schema">${schemaTekst}</span></div>
      </div>
      <div class="hero-meta">
        <div class="meta-item">
          <div class="meta-label">Verloren</div>
          <div class="meta-value num">−${verloren}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Nog te gaan</div>
          <div class="meta-value num">${nodig.toFixed(1)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Doel</div>
          <div class="meta-value num">${s.streefGewicht}</div>
        </div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat"><div class="stat-label">Dagen resterend</div><div class="stat-value num">${dagenOver}</div><div class="stat-sub">tot ${fmt(s.eindDatum)}</div></div>
      <div class="stat"><div class="stat-label">TDEE</div><div class="stat-value num">${tdee}</div><div class="stat-sub">kcal/dag</div></div>
      <div class="stat"><div class="stat-label">7-daags gem.</div><div class="stat-value num">${gems.toFixed(1)} kg</div><div class="stat-sub">laatste week</div></div>
      <div class="stat"><div class="stat-label">Doel vandaag</div><div class="stat-value num">${doelVandaag.toFixed(1)} kg</div><div class="stat-sub">volgens doellijn</div></div>
      ${voorspellingTiles}
    </div>

    <div class="progress-card">
      <div class="progress-row">
        <div class="progress-name">Gewicht</div>
        <div class="track"><div class="fill fill-green" style="width:${gwPct.toFixed(1)}%"></div></div>
        <div class="progress-val">${gwPct.toFixed(0)}%</div>
      </div>
      <div class="progress-row">
        <div class="progress-name">Vet %</div>
        <div class="track"><div class="fill fill-blue" style="width:${vetPct.toFixed(1)}%"></div></div>
        <div class="progress-val">${vetPct.toFixed(0)}%</div>
      </div>
      <div class="progress-row">
        <div class="progress-name">Tijd</div>
        <div class="track"><div class="fill fill-orange" style="width:${tijdPct.toFixed(1)}%"></div></div>
        <div class="progress-val">${tijdPct.toFixed(0)}%</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Gewichtsverloop</div>
          <div class="card-meta">Doellijn vs. werkelijk gewicht</div>
        </div>
        <div class="filter">
          <button class="filter-btn ${filterDays===30?'active':''}" data-days="30" onclick="setFilter(30)">30d</button>
          <button class="filter-btn ${filterDays===60?'active':''}" data-days="60" onclick="setFilter(60)">60d</button>
          <button class="filter-btn ${filterDays===0?'active':''}" data-days="0" onclick="setFilter(0)">Alles</button>
        </div>
      </div>
      <div class="chart-wrap"><canvas id="weightChart"></canvas></div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">Recente metingen</div>
        <div class="card-meta">${App.metingen.length} totaal</div>
      </div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr><th>Datum</th><th>Gewicht</th><th>Doel</th><th>Verschil</th><th>Vet %</th><th></th></tr></thead>
          <tbody id="tableBody"></tbody>
        </table>
      </div>
    </div>
  `;

  renderGewichtChart();
  renderGewichtTable();
}

function gem7d(datumStr) {
  if (datumStr > vandaagStr()) return null;
  const end = new Date(datumStr);
  const start = new Date(datumStr);
  start.setDate(start.getDate() - 6);
  const metingen = App.metingen.filter(d => {
    const t = new Date(d.datum);
    return t >= start && t <= end;
  });
  if (!metingen.length) return null;
  return +(metingen.reduce((a, d) => a + d.gewicht, 0) / metingen.length).toFixed(2);
}

function bouwTijdlijn() {
  const s = getS();
  let start = new Date(s.beginDatum);
  const einde = new Date(s.eindDatum);
  if (filterDays) {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - filterDays);
    if (cutoff > start) start = cutoff;
  }
  const map = new Map(App.metingen.map(d => [d.datum, d]));
  const out = [];
  for (let d = new Date(start); d <= einde; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const m = map.get(key);
    out.push({ datum: key, gewicht: m ? m.gewicht : null, doel: doelGewicht(key) });
  }
  return out;
}

function renderGewichtChart() {
  const canvas = document.getElementById('weightChart');
  if (!canvas) return;
  const tijdlijn = bouwTijdlijn();
  const labels = tijdlijn.map(d => fmt(d.datum));

  const trend = berekenTrend();
  const voorspelling = trend
    ? tijdlijn.map(d => d.datum >= trend.vanafDatum ? voorspelGewicht(d.datum, trend) : null)
    : [];

  if (weightChart) { weightChart.destroy(); weightChart = null; }
  weightChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Doellijn',
          data: tijdlijn.map(d => d.doel),
          borderColor: '#c47a2e',
          backgroundColor: 'transparent',
          tension: 0,
          pointRadius: 0,
          borderWidth: 2,
          borderDash: [6, 4],
          order: 2
        },
        ...(trend ? [{
          label: 'Voorspelling',
          data: voorspelling,
          borderColor: '#5a4fcf',
          backgroundColor: 'transparent',
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
          borderDash: [3, 4],
          spanGaps: true,
          order: 3
        }] : []),
        {
          label: '7-daags gem.',
          data: tijdlijn.map(d => gem7d(d.datum)),
          borderColor: '#4a7a9b',
          backgroundColor: 'transparent',
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
          spanGaps: true,
          order: 0
        },
        {
          label: 'Werkelijk',
          data: tijdlijn.map(d => d.gewicht),
          borderColor: '#2d9a6a',
          backgroundColor: 'rgba(45, 154, 106, 0.08)',
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#2d9a6a',
          borderWidth: 2.5,
          fill: true,
          spanGaps: true,
          order: 1
        }
      ]
    },
    options: chartOpts()
  });
}

function chartOpts() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: {
          color: '#7a9488',
          font: { size: 12, family: "'DM Sans', sans-serif" },
          boxWidth: 12,
          padding: 18,
          usePointStyle: true,
          pointStyle: 'line'
        }
      },
      tooltip: {
        backgroundColor: '#152019',
        titleFont: { size: 12, family: "'DM Sans', sans-serif" },
        bodyFont: { size: 12, family: "'DM Sans', sans-serif" },
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4,
        filter: ctx => ctx.parsed.y !== null
      }
    },
    scales: {
      x: {
        ticks: { color: '#7a9488', maxRotation: 0, font: { size: 11 }, maxTicksLimit: 7 },
        grid: { color: 'rgba(26, 107, 69, 0.06)' },
        border: { display: false }
      },
      y: {
        ticks: { color: '#7a9488', font: { size: 11 } },
        grid: { color: 'rgba(26, 107, 69, 0.06)' },
        border: { display: false }
      }
    }
  };
}

function renderGewichtTable() {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;
  tbody.innerHTML = [...App.metingen].reverse().slice(0, 15).map(d => {
    const doel = doelGewicht(d.datum);
    const diff = (d.gewicht - doel).toFixed(2);
    const cls = parseFloat(diff) <= 0 ? 'pos' : 'neg';
    const sign = parseFloat(diff) > 0 ? '+' : '';
    return `<tr><td>${fmt(d.datum)}</td><td class="num"><strong>${d.gewicht}</strong></td><td class="num">${doel.toFixed(1)}</td><td><span class="delta ${cls}">${sign}${diff}</span></td><td class="num">${d.vet_perc != null ? d.vet_perc + '%' : '—'}</td><td><button class="icon-btn" title="Verwijderen" onclick="verwijderMeting('${d.datum}')">✕</button></td></tr>`;
  }).join('');
}

function openMeting() {
  document.getElementById('inputDatum').value   = vandaagStr();
  document.getElementById('inputGewicht').value = '';
  document.getElementById('inputVet').value     = '';
  document.getElementById('metingOverlay').classList.add('open');
}

async function saveMeting() {
  const datum   = document.getElementById('inputDatum').value;
  const gewicht = parseFloat(document.getElementById('inputGewicht').value);
  const vet     = document.getElementById('inputVet').value ? parseFloat(document.getElementById('inputVet').value) : null;
  if (!datum || isNaN(gewicht)) { alert('Vul datum en gewicht in.'); return; }
  const btn = document.getElementById('btnSaveMeting');
  btn.disabled = true; btn.textContent = 'Opslaan…';
  try {
    await turso([ex('INSERT OR REPLACE INTO metingen (datum,gewicht,vet_perc) VALUES (?,?,?)',
      [arg(datum), arg(gewicht), arg(vet)])]);
    closeModal('metingOverlay');
    await loadAll(); renderActiveTab();
  } catch(e) { alert('Fout: ' + e.message); }
  finally { btn.disabled = false; btn.textContent = 'Opslaan'; }
}

async function verwijderMeting(datum) {
  if (!confirm(`Meting van ${fmt(datum)} verwijderen?`)) return;
  try {
    await turso([ex('DELETE FROM metingen WHERE datum = ?', [arg(datum)])]);
    await loadAll(); renderActiveTab();
  } catch(e) { alert('Fout: ' + e.message); }
}
