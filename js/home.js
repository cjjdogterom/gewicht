/* Home-dashboard: samenvatting van gewicht, workouts en voeding */

function renderHome() {
  const el = document.getElementById('view-home');
  if (!el) return;
  const s = getS();
  const vandaag = vandaagStr();

  /* gewicht */
  const last = App.metingen[App.metingen.length - 1];
  let gewichtHtml;
  if (last) {
    const opSchema = last.gewicht - doelGewicht(vandaag);
    const schemaTekst = opSchema <= 0
      ? `<span class="ahead">${Math.abs(opSchema).toFixed(1)} kg vóór schema</span>`
      : `<span class="behind">${opSchema.toFixed(1)} kg achter schema</span>`;
    gewichtHtml = `
      <div class="home-kaart" onclick="switchTab('gewicht')">
        <div class="home-kaart-label">Gewicht</div>
        <div class="home-kaart-waarde num">${last.gewicht.toFixed(1)} <span class="unit-sm">kg</span></div>
        <div class="home-kaart-sub">${relDatum(last.datum)} · ${schemaTekst}</div>
      </div>`;
  } else {
    gewichtHtml = `
      <div class="home-kaart" onclick="switchTab('gewicht')">
        <div class="home-kaart-label">Gewicht</div>
        <div class="home-kaart-waarde">—</div>
        <div class="home-kaart-sub">Nog geen meting</div>
      </div>`;
  }

  /* voeding vandaag */
  const eten = App.voeding.filter(i => i.datum === vandaag);
  const kcal = Math.round(eten.reduce((a, i) => a + i.kcal, 0));
  const eiwit = Math.round(eten.reduce((a, i) => a + i.eiwit, 0));
  const kcalPct = Math.min(100, (kcal / s.kcalDoel) * 100);
  const voedingHtml = `
    <div class="home-kaart" onclick="switchTab('voeding')">
      <div class="home-kaart-label">Voeding vandaag</div>
      <div class="home-kaart-waarde num">${kcal.toLocaleString('nl-NL')} <span class="unit-sm">/ ${s.kcalDoel} kcal</span></div>
      <div class="track" style="margin:8px 0 6px"><div class="fill ${kcal > s.kcalDoel ? 'fill-orange' : 'fill-green'}" style="width:${kcalPct.toFixed(1)}%"></div></div>
      <div class="home-kaart-sub">Eiwit: ${eiwit} / ${s.eiwitDoel} g</div>
    </div>`;

  /* workouts */
  const week = workoutsDezeWeek();
  const laatsteWo = App.workouts[0];
  const workoutHtml = `
    <div class="home-kaart" onclick="switchTab('workout')">
      <div class="home-kaart-label">Workouts</div>
      <div class="home-kaart-waarde num">${week.aantal} <span class="unit-sm">deze week</span></div>
      <div class="home-kaart-sub">${laatsteWo
        ? `Laatste: ${esc(laatsteWo.naam)} · ${relDatum(laatsteWo.datum)}`
        : 'Nog geen workouts'}</div>
    </div>`;

  const groet = (() => {
    const u = new Date().getHours();
    if (u < 6) return 'Goedenacht';
    if (u < 12) return 'Goedemorgen';
    if (u < 18) return 'Goedemiddag';
    return 'Goedenavond';
  })();

  el.innerHTML = `
    <div class="home-groet">
      <div class="home-groet-titel">${groet}</div>
      <div class="card-meta">${new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
    </div>

    ${W.actief ? `
      <div class="card resume-card" onclick="switchTab('workout')">
        <div><strong>Workout bezig</strong><div class="card-meta">${esc(W.actief.naam)} — tik om verder te gaan</div></div>
        <span class="pulse-dot"></span>
      </div>` : ''}

    <div class="home-grid">
      ${gewichtHtml}
      ${voedingHtml}
      ${workoutHtml}
    </div>

    <div class="section-title">Snelle acties</div>
    <div class="quick-acties">
      <button class="btn-primary" onclick="openMeting()">+ Meting</button>
      <button class="btn-primary" onclick="switchTab('workout');${W.actief ? '' : 'startLegeWorkout()'}">${W.actief ? 'Workout hervatten' : 'Start workout'}</button>
      <button class="btn-primary" onclick="switchTab('voeding')">+ Voeding</button>
    </div>
  `;
}
