/* Voeding-module: dagboek, kcal- en macrodoelen, productenbibliotheek */

const V = {
  datum: null,          // geselecteerde dag (YYYY-MM-DD)
  addMaaltijd: null,
  addProduct: null,     // gekozen product uit bibliotheek
  zoek: ''
};

const MAALTIJDEN = ['Ontbijt', 'Lunch', 'Diner', 'Snacks'];

/* Basisproducten (per 100 g / 100 ml) zodat zoeken direct wat oplevert */
const BASIS_PRODUCTEN = [
  { naam: 'Havermout', kcal_100: 372, eiwit_100: 13, koolh_100: 60, vet_100: 7 },
  { naam: 'Volkoren brood (snee, 35 g)', kcal_100: 240, eiwit_100: 10, koolh_100: 41, vet_100: 3 },
  { naam: 'Witte rijst (gekookt)', kcal_100: 130, eiwit_100: 2.7, koolh_100: 28, vet_100: 0.3 },
  { naam: 'Volkoren pasta (gekookt)', kcal_100: 150, eiwit_100: 6, koolh_100: 29, vet_100: 1 },
  { naam: 'Aardappel (gekookt)', kcal_100: 87, eiwit_100: 2, koolh_100: 20, vet_100: 0.1 },
  { naam: 'Zoete aardappel', kcal_100: 86, eiwit_100: 1.6, koolh_100: 20, vet_100: 0.1 },
  { naam: 'Kipfilet (rauw)', kcal_100: 107, eiwit_100: 23, koolh_100: 0, vet_100: 1.5 },
  { naam: 'Kipfilet (bereid)', kcal_100: 148, eiwit_100: 30, koolh_100: 0, vet_100: 3 },
  { naam: 'Rundergehakt (mager)', kcal_100: 179, eiwit_100: 20, koolh_100: 0, vet_100: 11 },
  { naam: 'Zalm', kcal_100: 208, eiwit_100: 20, koolh_100: 0, vet_100: 13 },
  { naam: 'Tonijn (blik, water)', kcal_100: 116, eiwit_100: 26, koolh_100: 0, vet_100: 1 },
  { naam: 'Ei (per stuk, 60 g)', kcal_100: 155, eiwit_100: 13, koolh_100: 1, vet_100: 11 },
  { naam: 'Magere kwark', kcal_100: 57, eiwit_100: 10, koolh_100: 4, vet_100: 0.2 },
  { naam: 'Griekse yoghurt (0%)', kcal_100: 57, eiwit_100: 10, koolh_100: 4, vet_100: 0.2 },
  { naam: 'Griekse yoghurt (vol)', kcal_100: 121, eiwit_100: 4, koolh_100: 4, vet_100: 10 },
  { naam: 'Halfvolle melk', kcal_100: 46, eiwit_100: 3.4, koolh_100: 4.7, vet_100: 1.5 },
  { naam: 'Whey eiwitshake (poeder)', kcal_100: 380, eiwit_100: 78, koolh_100: 6, vet_100: 5 },
  { naam: '30+ kaas', kcal_100: 270, eiwit_100: 29, koolh_100: 0, vet_100: 17 },
  { naam: 'Pindakaas', kcal_100: 600, eiwit_100: 25, koolh_100: 12, vet_100: 47 },
  { naam: 'Banaan (per stuk, 120 g)', kcal_100: 89, eiwit_100: 1.1, koolh_100: 23, vet_100: 0.3 },
  { naam: 'Appel (per stuk, 180 g)', kcal_100: 52, eiwit_100: 0.3, koolh_100: 14, vet_100: 0.2 },
  { naam: 'Blauwe bessen', kcal_100: 57, eiwit_100: 0.7, koolh_100: 14, vet_100: 0.3 },
  { naam: 'Broccoli', kcal_100: 34, eiwit_100: 2.8, koolh_100: 7, vet_100: 0.4 },
  { naam: 'Sperziebonen', kcal_100: 31, eiwit_100: 1.8, koolh_100: 7, vet_100: 0.2 },
  { naam: 'Gemengde sla', kcal_100: 17, eiwit_100: 1.2, koolh_100: 3, vet_100: 0.2 },
  { naam: 'Avocado', kcal_100: 160, eiwit_100: 2, koolh_100: 9, vet_100: 15 },
  { naam: 'Olijfolie', kcal_100: 884, eiwit_100: 0, koolh_100: 0, vet_100: 100 },
  { naam: 'Roomboter', kcal_100: 717, eiwit_100: 0.9, koolh_100: 0.1, vet_100: 81 },
  { naam: 'Hummus', kcal_100: 177, eiwit_100: 5, koolh_100: 14, vet_100: 11 },
  { naam: 'Noten (gemengd)', kcal_100: 607, eiwit_100: 20, koolh_100: 21, vet_100: 54 },
  { naam: 'Rijstwafel (per stuk, 8 g)', kcal_100: 387, eiwit_100: 8, koolh_100: 81, vet_100: 3 },
  { naam: 'Donker chocolade (75%)', kcal_100: 546, eiwit_100: 8, koolh_100: 46, vet_100: 38 },
  { naam: 'Kwarktaart / gebak', kcal_100: 321, eiwit_100: 5, koolh_100: 35, vet_100: 18 },
  { naam: 'Cola (regular)', kcal_100: 42, eiwit_100: 0, koolh_100: 10.6, vet_100: 0 },
  { naam: 'Bier (pils)', kcal_100: 43, eiwit_100: 0.5, koolh_100: 3.6, vet_100: 0 },
  { naam: 'Rode wijn', kcal_100: 85, eiwit_100: 0.1, koolh_100: 2.6, vet_100: 0 }
];

function alleProducten() {
  return [...App.producten, ...BASIS_PRODUCTEN.filter(b => !App.producten.some(p => p.naam === b.naam))];
}

function vDagItems() {
  return App.voeding.filter(i => i.datum === V.datum);
}

function renderVoeding() {
  const el = document.getElementById('view-voeding');
  if (!el) return;
  if (!V.datum) V.datum = vandaagStr();
  const s = getS();
  const items = vDagItems();

  const tot = items.reduce((a, i) => ({
    kcal: a.kcal + i.kcal, eiwit: a.eiwit + i.eiwit, koolh: a.koolh + i.koolh, vet: a.vet + i.vet
  }), { kcal: 0, eiwit: 0, koolh: 0, vet: 0 });

  const over = Math.round(s.kcalDoel - tot.kcal);
  const kcalPct = Math.min(100, (tot.kcal / s.kcalDoel) * 100);

  const macroBar = (label, val, doel, cls) => `
    <div class="progress-row">
      <div class="progress-name">${label}</div>
      <div class="track"><div class="fill ${cls}" style="width:${Math.min(100, doel ? (val / doel) * 100 : 0).toFixed(1)}%"></div></div>
      <div class="progress-val" style="width:auto">${Math.round(val)} / ${doel} g</div>
    </div>`;

  const maaltijdKaarten = MAALTIJDEN.map(m => {
    const mi = items.filter(i => i.maaltijd === m);
    const mKcal = Math.round(mi.reduce((a, i) => a + i.kcal, 0));
    const rows = mi.map(i => `
      <div class="v-item">
        <div class="v-item-info">
          <div class="v-item-naam">${esc(i.naam)}</div>
          <div class="v-item-sub">${i.gram ? i.gram + ' g · ' : ''}E ${Math.round(i.eiwit)} · K ${Math.round(i.koolh)} · V ${Math.round(i.vet)}</div>
        </div>
        <div class="v-item-kcal num">${Math.round(i.kcal)}</div>
        <button class="icon-btn" onclick="verwijderVoedingItem(${i.id})">✕</button>
      </div>`).join('');
    return `
      <div class="card v-maaltijd">
        <div class="v-maaltijd-head">
          <div class="card-title">${m}</div>
          <div class="card-meta num">${mKcal} kcal</div>
        </div>
        ${rows}
        <button class="btn-ghost btn-block" onclick="openVoedingAdd('${m}')">+ Voeg toe</button>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="datum-nav">
      <button class="icon-btn" onclick="vDag(-1)">‹</button>
      <div class="datum-nav-label" onclick="V.datum='${vandaagStr()}';renderVoeding()">${relDatum(V.datum)}</div>
      <button class="icon-btn" onclick="vDag(1)">›</button>
    </div>

    <div class="hero v-hero">
      <div class="hero-main">
        <div class="hero-label">${over >= 0 ? 'Nog te eten' : 'Over budget'}</div>
        <div class="hero-value num">${Math.abs(over).toLocaleString('nl-NL')} <span class="unit">kcal</span></div>
        <div class="hero-sub">${Math.round(tot.kcal)} van ${s.kcalDoel} kcal gegeten</div>
        <div class="kcal-track"><div class="kcal-fill ${over < 0 ? 'over' : ''}" style="width:${kcalPct.toFixed(1)}%"></div></div>
      </div>
    </div>

    <div class="progress-card">
      ${macroBar('Eiwit', tot.eiwit, s.eiwitDoel, 'fill-green')}
      ${macroBar('Koolh.', tot.koolh, s.koolhDoel, 'fill-blue')}
      ${macroBar('Vet', tot.vet, s.vetDoel, 'fill-orange')}
    </div>

    ${maaltijdKaarten}
  `;
}

function vDag(delta) {
  const d = new Date(V.datum + 'T12:00');
  d.setDate(d.getDate() + delta);
  V.datum = d.toISOString().slice(0, 10);
  renderVoeding();
}

/* --- item toevoegen --- */

function openVoedingAdd(maaltijd) {
  V.addMaaltijd = maaltijd;
  V.addProduct = null;
  V.zoek = '';
  document.getElementById('vaTitel').textContent = `Toevoegen aan ${maaltijd.toLowerCase()}`;
  document.getElementById('vaZoek').value = '';
  document.getElementById('vaGram').value = '100';
  vaToonStap('zoek');
  renderProductLijst();
  document.getElementById('voedingAddOverlay').classList.add('open');
  setTimeout(() => document.getElementById('vaZoek').focus(), 50);
}

function vaToonStap(stap) {
  document.getElementById('vaStapZoek').style.display = stap === 'zoek' ? 'block' : 'none';
  document.getElementById('vaStapGram').style.display = stap === 'gram' ? 'block' : 'none';
  document.getElementById('vaStapNieuw').style.display = stap === 'nieuw' ? 'block' : 'none';
}

function vaZoekInput(val) {
  V.zoek = val.toLowerCase();
  renderProductLijst();
}

function renderProductLijst() {
  const lijst = alleProducten()
    .filter(p => !V.zoek || p.naam.toLowerCase().includes(V.zoek))
    .slice(0, 30);
  document.getElementById('vaLijst').innerHTML = lijst.map((p, i) => `
    <div class="picker-item" onclick="vaKies(${i})">
      <div>
        <div class="picker-naam">${esc(p.naam)}${p.id ? ' <span class="eigen-tag">eigen</span>' : ''}</div>
        <div class="picker-sub">${Math.round(p.kcal_100)} kcal · E ${p.eiwit_100} · K ${p.koolh_100} · V ${p.vet_100} (per 100 g)</div>
      </div>
      <span class="picker-check">›</span>
    </div>`).join('') || `<div class="empty" style="padding:20px">Niets gevonden. Maak een nieuw product aan.</div>`;
  window._vaLijst = lijst;
}

function vaKies(i) {
  V.addProduct = window._vaLijst[i];
  document.getElementById('vaProdNaam').textContent = V.addProduct.naam;
  document.getElementById('vaGram').value = '100';
  vaUpdatePreview();
  vaToonStap('gram');
  setTimeout(() => { const g = document.getElementById('vaGram'); g.focus(); g.select(); }, 50);
}

function vaUpdatePreview() {
  const p = V.addProduct;
  const gram = parseFloat(document.getElementById('vaGram').value) || 0;
  const f = gram / 100;
  document.getElementById('vaPreview').innerHTML = `
    <div class="tdee-line"><span>Calorieën</span><span>${Math.round(p.kcal_100 * f)} kcal</span></div>
    <div class="tdee-line"><span>Eiwit</span><span>${(p.eiwit_100 * f).toFixed(1)} g</span></div>
    <div class="tdee-line"><span>Koolhydraten</span><span>${(p.koolh_100 * f).toFixed(1)} g</span></div>
    <div class="tdee-line"><span>Vet</span><span>${(p.vet_100 * f).toFixed(1)} g</span></div>`;
}

async function vaVoegToe() {
  const p = V.addProduct;
  const gram = parseFloat(document.getElementById('vaGram').value);
  if (!p || !gram || gram <= 0) { alert('Vul het aantal gram in.'); return; }
  const f = gram / 100;
  await voedingInsert(p.naam, gram, p.kcal_100 * f, p.eiwit_100 * f, p.koolh_100 * f, p.vet_100 * f);
}

function vaNieuw() {
  ['vnNaam', 'vnKcal', 'vnEiwit', 'vnKoolh', 'vnVet'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('vnGram').value = '100';
  document.getElementById('vnBewaar').checked = true;
  document.getElementById('vnNaam').value = document.getElementById('vaZoek').value;
  vaToonStap('nieuw');
}

async function vnVoegToe() {
  const naam = document.getElementById('vnNaam').value.trim();
  const kcal100 = parseFloat(document.getElementById('vnKcal').value);
  if (!naam || isNaN(kcal100)) { alert('Vul minstens naam en kcal per 100 g in.'); return; }
  const e100 = parseFloat(document.getElementById('vnEiwit').value) || 0;
  const k100 = parseFloat(document.getElementById('vnKoolh').value) || 0;
  const v100 = parseFloat(document.getElementById('vnVet').value) || 0;
  const gram = parseFloat(document.getElementById('vnGram').value) || 100;
  const f = gram / 100;

  const stmts = [];
  if (document.getElementById('vnBewaar').checked) {
    stmts.push(ex('INSERT OR REPLACE INTO producten (naam, kcal_100, eiwit_100, koolh_100, vet_100) VALUES (?,?,?,?,?)',
      [arg(naam), arg(kcal100), arg(e100), arg(k100), arg(v100)]));
  }
  stmts.push(ex('INSERT INTO voeding (datum, maaltijd, naam, gram, kcal, eiwit, koolh, vet) VALUES (?,?,?,?,?,?,?,?)',
    [arg(V.datum), arg(V.addMaaltijd), arg(naam), arg(gram),
     arg(+(kcal100 * f).toFixed(1)), arg(+(e100 * f).toFixed(1)), arg(+(k100 * f).toFixed(1)), arg(+(v100 * f).toFixed(1))]));
  try {
    await turso(stmts);
    closeModal('voedingAddOverlay');
    await loadAll(); renderActiveTab();
  } catch (e) { alert('Fout: ' + e.message); }
}

async function voedingInsert(naam, gram, kcal, eiwit, koolh, vet) {
  try {
    await turso([ex('INSERT INTO voeding (datum, maaltijd, naam, gram, kcal, eiwit, koolh, vet) VALUES (?,?,?,?,?,?,?,?)',
      [arg(V.datum), arg(V.addMaaltijd), arg(naam), arg(gram),
       arg(+kcal.toFixed(1)), arg(+eiwit.toFixed(1)), arg(+koolh.toFixed(1)), arg(+vet.toFixed(1))])]);
    closeModal('voedingAddOverlay');
    await loadAll(); renderActiveTab();
  } catch (e) { alert('Fout: ' + e.message); }
}

async function verwijderVoedingItem(id) {
  try {
    await turso([ex('DELETE FROM voeding WHERE id = ?', [arg(id)])]);
    await loadAll(); renderActiveTab();
  } catch (e) { alert('Fout: ' + e.message); }
}
