/* Database-laag: Turso HTTP API + centrale app-state */

const DB_URL   = 'https://gewicht-cjjdogterom.aws-ap-northeast-1.turso.io';
const DB_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA1NTYwMDMsImlkIjoiMDE5ZTkxNjgtNWYwMS03ZTYwLTg4MTctN2QwYzdmMWJlY2FmIiwicmlkIjoiMGMwZjM0MTgtMDNhYy00MWNkLWJiMjktMjNlYjVjZjUwODFlIn0.isB23ohlqDeXCWbO218I-a_nMyAQ8XeWJ8JeIpM7l1vwBBrne_wOGzAeVYklCL82MEBukd5sHfdou48-6TwlCQ';

const DEFAULTS = {
  beginGewicht: 87, streefGewicht: 74, beginVet: 25, doelVet: 16,
  beginDatum: '2025-09-29', eindDatum: '2026-06-01',
  bmr: 1770, eat: 415, neat: 350, tef: 170,
  kcalDoel: 2200, eiwitDoel: 140, koolhDoel: 220, vetDoel: 70
};

const App = {
  settings: null,
  metingen: [],
  workouts: [],
  routines: [],
  voeding: [],
  producten: [],
  eigenOefeningen: []
};

async function turso(requests) {
  const res = await fetch(`${DB_URL}/v2/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${DB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [...requests, { type: 'close' }] })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const errs = json.results.filter(r => r.type === 'error');
  if (errs.length) throw new Error(errs[0].error?.message || 'DB fout');
  return json.results;
}

function ex(sql, args = []) {
  return { type: 'execute', stmt: { sql, args } };
}

function arg(v) {
  if (v === null || v === undefined || v === '') return { type: 'null' };
  if (typeof v === 'number') return Number.isInteger(v) ? { type: 'integer', value: String(v) } : { type: 'float', value: v };
  return { type: 'text', value: String(v) };
}

function rowsToObjs(result) {
  const cols = result.response.result.cols.map(c => c.name);
  return result.response.result.rows.map(row =>
    Object.fromEntries(cols.map((c, i) => [c, row[i]?.value ?? null]))
  );
}

const num = v => v == null ? null : parseFloat(v);

async function loadAll() {
  const [mRes, sRes, wRes, rRes, vRes, pRes, eRes] = await turso([
    ex('SELECT datum, gewicht, vet_perc FROM metingen ORDER BY datum'),
    ex('SELECT sleutel, waarde FROM instellingen'),
    ex('SELECT id, datum, naam, duur_sec, notitie, data FROM workouts ORDER BY datum DESC, id DESC'),
    ex('SELECT id, naam, volgorde, data FROM routines ORDER BY volgorde, id'),
    ex('SELECT id, datum, maaltijd, naam, gram, kcal, eiwit, koolh, vet FROM voeding ORDER BY datum, id'),
    ex('SELECT id, naam, kcal_100, eiwit_100, koolh_100, vet_100 FROM producten ORDER BY naam'),
    ex('SELECT id, naam, spiergroep, materiaal FROM eigen_oefeningen ORDER BY naam')
  ]);

  App.metingen = rowsToObjs(mRes).map(r => ({
    datum: r.datum, gewicht: num(r.gewicht), vet_perc: num(r.vet_perc)
  }));

  const saved = Object.fromEntries(rowsToObjs(sRes).map(r =>
    [r.sleutel, isNaN(r.waarde) ? r.waarde : parseFloat(r.waarde)]));
  App.settings = { ...DEFAULTS, ...saved };

  App.workouts = rowsToObjs(wRes).map(r => ({
    id: parseInt(r.id), datum: r.datum, naam: r.naam || 'Workout',
    duur_sec: parseInt(r.duur_sec) || 0, notitie: r.notitie,
    oefeningen: JSON.parse(r.data)
  }));

  App.routines = rowsToObjs(rRes).map(r => ({
    id: parseInt(r.id), naam: r.naam, volgorde: parseInt(r.volgorde) || 0,
    oefeningen: JSON.parse(r.data)
  }));

  App.voeding = rowsToObjs(vRes).map(r => ({
    id: parseInt(r.id), datum: r.datum, maaltijd: r.maaltijd, naam: r.naam,
    gram: num(r.gram), kcal: num(r.kcal) || 0,
    eiwit: num(r.eiwit) || 0, koolh: num(r.koolh) || 0, vet: num(r.vet) || 0
  }));

  App.producten = rowsToObjs(pRes).map(r => ({
    id: parseInt(r.id), naam: r.naam, kcal_100: num(r.kcal_100) || 0,
    eiwit_100: num(r.eiwit_100) || 0, koolh_100: num(r.koolh_100) || 0, vet_100: num(r.vet_100) || 0
  }));

  App.eigenOefeningen = rowsToObjs(eRes).map(r => ({
    id: parseInt(r.id), naam: r.naam, spier: r.spiergroep || 'Overig', mat: r.materiaal || 'Overig'
  }));
}

function getS() { return App.settings || DEFAULTS; }

/* Gedeelde helpers */
function fmt(d) { const [y, m, day] = d.split('-'); return `${day}-${m}-${y}`; }
function vandaagStr() { return new Date().toISOString().slice(0, 10); }
function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function fmtDuur(sec) {
  const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
  return h ? `${h}u ${m}m` : `${m}m`;
}

function fmtKlok(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function relDatum(d) {
  const vandaag = vandaagStr();
  if (d === vandaag) return 'Vandaag';
  const gister = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (d === gister) return 'Gisteren';
  const dagen = Math.round((new Date(vandaag) - new Date(d)) / 86400000);
  if (dagen > 0 && dagen < 7) {
    return new Date(d + 'T12:00').toLocaleDateString('nl-NL', { weekday: 'long' });
  }
  return fmt(d);
}
