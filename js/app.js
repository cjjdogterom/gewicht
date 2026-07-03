/* App-schil: tabbladen, instellingen, initialisatie */

let activeTab = 'home';

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tabview').forEach(v => v.classList.remove('actief'));
  document.getElementById('view-' + tab).classList.add('actief');
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  window.scrollTo(0, 0);
  renderActiveTab();
}

function renderActiveTab() {
  updateNavBadge();
  if (activeTab === 'home') renderHome();
  else if (activeTab === 'gewicht') renderGewicht();
  else if (activeTab === 'workout') renderWorkout();
  else if (activeTab === 'voeding') renderVoeding();
}

/* --- instellingen --- */

function updateTdee() {
  const [bmr, eat, neat, tef] = ['sBmr', 'sEat', 'sNeat', 'sTef'].map(id => parseFloat(document.getElementById(id).value) || 0);
  document.getElementById('tdeeDisplay').innerHTML = `
    <div class="tdee-line"><span>BMR</span><span>${bmr} kcal</span></div>
    <div class="tdee-line"><span>EAT (sport)</span><span>${eat} kcal</span></div>
    <div class="tdee-line"><span>NEAT (beweging)</span><span>${neat} kcal</span></div>
    <div class="tdee-line"><span>TEF (spijsvertering)</span><span>${tef} kcal</span></div>
    <div class="tdee-line total"><span>TDEE totaal</span><span>${bmr + eat + neat + tef} kcal/dag</span></div>`;
}

const SETTINGS_MAP = {
  beginGewicht: 'sBeginGewicht', streefGewicht: 'sStreefGewicht', beginVet: 'sBeginVet', doelVet: 'sDoelVet',
  beginDatum: 'sBeginDatum', eindDatum: 'sEindDatum', bmr: 'sBmr', eat: 'sEat', neat: 'sNeat', tef: 'sTef',
  kcalDoel: 'sKcalDoel', eiwitDoel: 'sEiwitDoel', koolhDoel: 'sKoolhDoel', vetDoel: 'sVetDoel'
};

function openInstellingen() {
  const s = getS();
  Object.entries(SETTINGS_MAP).forEach(([key, id]) => { document.getElementById(id).value = s[key]; });
  updateTdee();
  ['sBmr', 'sEat', 'sNeat', 'sTef'].forEach(id => document.getElementById(id).oninput = updateTdee);
  document.getElementById('instellingenOverlay').classList.add('open');
}

async function saveInstellingen() {
  const btn = document.getElementById('btnSaveSettings');
  btn.disabled = true; btn.textContent = 'Opslaan…';
  try {
    await turso(Object.entries(SETTINGS_MAP).map(([key, id]) =>
      ex('INSERT OR REPLACE INTO instellingen (sleutel,waarde) VALUES (?,?)',
        [arg(key), arg(document.getElementById(id).value)])));
    closeModal('instellingenOverlay');
    await loadAll(); renderActiveTab();
  } catch (e) { alert('Fout: ' + e.message); }
  finally { btn.disabled = false; btn.textContent = 'Opslaan'; }
}

async function verwijderAlleData() {
  if (!confirm('Weet je zeker dat je ALLE metingen wilt verwijderen?')) return;
  try {
    await turso([ex('DELETE FROM metingen')]);
    closeModal('instellingenOverlay');
    await loadAll(); renderActiveTab();
  } catch (e) { alert('Fout: ' + e.message); }
}

/* --- modals --- */

function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function closeOnOutside(e, id) { if (e.target === document.getElementById(id)) closeModal(id); }

/* --- init --- */

laadActief();

loadAll()
  .then(() => {
    document.getElementById('dbStatus').className = 'status ok';
    document.getElementById('dbStatus').textContent = 'verbonden';
    if (W.actief) activeTab = 'workout';
    switchTab(activeTab);
    startTicker();
  })
  .catch(e => {
    document.getElementById('dbStatus').className = 'status err';
    document.getElementById('dbStatus').textContent = 'offline';
    document.getElementById('view-home').innerHTML =
      `<div class="card"><div class="empty" style="color:var(--danger)">Database niet bereikbaar: ${e.message}</div></div>`;
  });
