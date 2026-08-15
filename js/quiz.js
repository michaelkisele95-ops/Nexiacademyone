/* ============================================================
   QUIZ.JS — moteur de jeu NEXI ONE (v2)
   ============================================================ */

const enfantConnecte = JSON.parse(sessionStorage.getItem("nexi_enfant") || "null");
if (!enfantConnecte) window.location.href = "index.html";

document.getElementById("titreAccueil").textContent = `Salut, ${enfantConnecte.nom || "champion"} !`;
if (enfantConnecte.classe) {
  document.getElementById("classeBadge").innerHTML =
    `<span class="serie-badge" style="background:linear-gradient(90deg,#6c4fd6,#4a6ee0); color:#fff;">🎓 Classe ${enfantConnecte.classe}</span>`;
}
document.getElementById("nexibotListe").innerHTML = nexibotHTML(nexibotPhrase("demarrage"));

const ecranListe = document.getElementById("ecranListe");
const ecranJeu = document.getElementById("ecranJeu");
const ecranFin = document.getElementById("ecranFin");
const listeDefisDiv = document.getElementById("listeDefis");

let defiEnCours = null;
let indexQuestion = 0;
let score = 0;
let minuteurId = null;
let tempsRestant = 0;
let debutQuestion = 0;
let reponsesDetail = [];

/* ---------- Série (streak) ---------- */
(async function afficherSerie() {
  try {
    const { serie } = await nexiHistorique(enfantConnecte.identifiant);
    if (serie > 0) {
      document.getElementById("serieZone").innerHTML =
        `<div class="serie-badge">🔥 Série de ${serie} défi${serie > 1 ? "s" : ""} !</div>`;
    }
  } catch (e) { /* silencieux */ }
})();

/* ---------- Écran 1 : liste des défis actifs pour la classe de l'enfant ---------- */
async function afficherListeDefis() {
  try {
    const defis = await nexiListerDefis(enfantConnecte.classe);
    if (defis.length === 0) {
      listeDefisDiv.innerHTML = `<div class="info">Aucun défi disponible pour ta classe pour le moment. Reviens vendredi ! 🗓️</div>`;
      return;
    }
    listeDefisDiv.innerHTML = defis
      .map(
        (d) => `
        <button class="option" onclick='demarrerDefi(${JSON.stringify(d.id)})'>
          🚀 ${d.titre} ${d.semaine ? `<span style="opacity:0.6;">(${d.semaine})</span>` : ""}
          <span style="float:right; opacity:0.6;">${d.questions.length} question${d.questions.length > 1 ? "s" : ""}</span>
        </button>`
      )
      .join("");
    window.NEXI_DEFIS_CACHE = defis;
  } catch (e) {
    listeDefisDiv.innerHTML = `<div class="erreur">Impossible de charger les défis. Réessaie dans quelques instants 🔌</div>`;
  }
}
afficherListeDefis();

/* ---------- Classement ---------- */
async function afficherClassement() {
  const zone = document.getElementById("classementZone");
  try {
    const classement = await nexiClassement();
    if (classement.length === 0) {
      zone.innerHTML = `<div class="info">Personne n'a encore joué cette semaine. Sois le premier !</div>`;
      return;
    }
    zone.innerHTML = classement
      .map((c, i) => `
        <div class="classement-ligne rang-${i + 1}">
          <div class="rang">${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</div>
          <div class="nom">${c.nom}</div>
          <div class="pct">${c.pourcentage}%</div>
        </div>`)
      .join("");
  } catch (e) {
    zone.innerHTML = `<div class="erreur">Classement indisponible pour le moment.</div>`;
  }
}
afficherClassement();

/* ---------- Démarrage d'un défi ---------- */
function demarrerDefi(defiId) {
  defiEnCours = (window.NEXI_DEFIS_CACHE || []).find((d) => d.id === defiId);
  if (!defiEnCours || defiEnCours.questions.length === 0) return;
  indexQuestion = 0;
  score = 0;
  reponsesDetail = [];
  ecranListe.style.display = "none";
  ecranJeu.style.display = "block";
  dessinerSentier();
  document.getElementById("nexibotJeu").innerHTML = nexibotHTML(nexibotPhrase("demarrage"));
  afficherQuestion();
}

function dessinerSentier() {
  document.getElementById("sentier").innerHTML = defiEnCours.questions
    .map((_, i) => `<div class="etape" id="etape${i}">${i + 1}</div>`)
    .join("");
}

/* ---------- Affichage d'une question ---------- */
function afficherQuestion() {
  const q = defiEnCours.questions[indexQuestion];
  document.getElementById("texteQuestion").textContent = q.question;
  document.getElementById("explicationZone").innerHTML = "";
  document.getElementById("matiereBadge").innerHTML = q.matiere
    ? `<div style="text-align:center; margin-bottom:8px;"><span class="badge badge-actif">${q.matiere}</span></div>` : "";

  document.querySelectorAll(".etape").forEach((el) => el.classList.remove("active"));
  document.getElementById("etape" + indexQuestion).classList.add("active");

  const zoneOptions = document.getElementById("zoneOptions");
  zoneOptions.innerHTML = q.options
    .map((opt, i) => `<button class="option" data-index="${i}">${opt}</button>`)
    .join("");
  zoneOptions.querySelectorAll(".option").forEach((btn) => {
    btn.addEventListener("click", () => validerReponse(parseInt(btn.dataset.index, 10)));
  });

  // Le temps par question peut varier (ex: 15s en logique, 30s en calcul)
  debutQuestion = Date.now();
  lancerMinuteur(q.tempsQuestion || defiEnCours.tempsParQuestion || 20);
}

/* ---------- Minuteur ---------- */
function lancerMinuteur(secondes) {
  clearInterval(minuteurId);
  tempsRestant = secondes;
  const barre = document.getElementById("barreTemps");
  barre.style.transition = "none";
  barre.style.width = "100%";
  barre.classList.remove("urgence");
  requestAnimationFrame(() => {
    barre.style.transition = `width ${secondes}s linear`;
    barre.style.width = "0%";
  });
  minuteurId = setInterval(() => {
    tempsRestant -= 1;
    if (tempsRestant <= Math.ceil(secondes * 0.25)) barre.classList.add("urgence");
    if (tempsRestant <= 0) { clearInterval(minuteurId); validerReponse(-1); }
  }, 1000);
}

/* ---------- Validation d'une réponse ---------- */
function validerReponse(indexChoisi) {
  clearInterval(minuteurId);
  const q = defiEnCours.questions[indexQuestion];
  const boutons = document.querySelectorAll("#zoneOptions .option");
  boutons.forEach((b) => (b.disabled = true));

  const estCorrecte = indexChoisi === q.bonneReponse;
  const tempsPris = Math.round((Date.now() - debutQuestion) / 1000);
  reponsesDetail.push({ ordre: indexQuestion + 1, matiere: q.matiere || "", correct: estCorrecte, tempsPris });

  if (boutons[q.bonneReponse]) boutons[q.bonneReponse].classList.add("bonne");
  if (indexChoisi >= 0 && !estCorrecte && boutons[indexChoisi]) boutons[indexChoisi].classList.add("mauvaise");

  const nexibotJeu = document.getElementById("nexibotJeu");
  if (estCorrecte) {
    score += 1;
    document.getElementById("scoreFlottant").textContent = `⭐ ${score}`;
    document.getElementById("etape" + indexQuestion).classList.add("faite");
    nexiSon("bonne");
    lancerConfettis(8);
    nexibotJeu.innerHTML = nexibotHTML(nexibotPhrase("bonneReponse"), "content");
  } else {
    nexiSon("mauvaise");
    nexibotJeu.innerHTML = nexibotHTML(nexibotPhrase(indexChoisi === -1 ? "tempsEcoule" : "mauvaiseReponse"), "encourage");
  }

  if (q.explication) {
    document.getElementById("explicationZone").innerHTML = `<div class="explication-bloc">💡 ${q.explication}</div>`;
  }

  setTimeout(() => {
    indexQuestion += 1;
    if (indexQuestion < defiEnCours.questions.length) afficherQuestion();
    else terminerDefi();
  }, q.explication ? 2400 : 1300);
}

/* ---------- Fin de défi ---------- */
async function terminerDefi() {
  ecranJeu.style.display = "none";
  ecranFin.style.display = "block";

  const total = defiEnCours.questions.length;
  const pourcentage = Math.round((score / total) * 100);
  document.getElementById("texteResultat").textContent = `Tu as trouvé ${score} bonne(s) réponse(s) sur ${total} (${pourcentage}%) !`;

  const nbEtoiles = pourcentage >= 80 ? 3 : pourcentage >= 50 ? 2 : 1;
  document.getElementById("etoilesFinales").textContent = "⭐".repeat(nbEtoiles) + "☆".repeat(3 - nbEtoiles);

  const badgeDiv = document.getElementById("badgeNiveau");
  if (pourcentage >= 80) badgeDiv.innerHTML = `<div class="badge-niveau badge-or">🥇 Niveau Or</div>`;
  else if (pourcentage >= 50) badgeDiv.innerHTML = `<div class="badge-niveau badge-argent">🥈 Niveau Argent</div>`;
  else badgeDiv.innerHTML = `<div class="badge-niveau badge-bronze">🥉 Niveau Bronze</div>`;

  document.getElementById("nexibotFin").innerHTML = nexibotHTML(nexibotPhrase("fin"), "content");
  nexiSon("fin");
  if (pourcentage >= 80) lancerConfettis(30);

  try {
    await nexiEnregistrerResultat({
      enfantId: enfantConnecte.id, enfantNom: enfantConnecte.nom,
      defiId: defiEnCours.id, defiTitre: defiEnCours.titre,
      score, total, reponses: reponsesDetail,
    });
  } catch (e) { /* on n'interrompt pas l'expérience de l'enfant si l'enregistrement échoue */ }
}

/* ---------- Confettis ---------- */
function lancerConfettis(n) {
  const emojis = ["⭐", "✨", "🪙", "💎"];
  for (let i = 0; i < n; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    c.style.left = Math.random() * 100 + "vw";
    c.style.animationDelay = Math.random() * 0.4 + "s";
    c.style.fontSize = 14 + Math.random() * 14 + "px";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3000);
  }
}
