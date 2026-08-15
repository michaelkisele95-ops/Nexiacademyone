/* ============================================================
   ADMIN.JS — tableau de bord administrateur NEXI ONE (v2)
   ============================================================ */

const motDePasseAdmin = sessionStorage.getItem("nexi_admin_mdp");
if (!motDePasseAdmin) window.location.href = "login.html";

document.getElementById("pastilleMode").innerHTML = NEXI_MODE_API
  ? '<span class="mode-pastille mode-connecte">🟢 Connecté à Google Sheets</span>'
  : '<span class="mode-pastille mode-demo">🟠 Mode démo local (données dans ce navigateur)</span>';

function deconnexionAdmin() {
  sessionStorage.removeItem("nexi_admin_mdp");
  window.location.href = "login.html";
}

/* ---------- Remplir les listes déroulantes de classes ---------- */
function optionsClasses(avecToutes) {
  let html = avecToutes ? `<option value="">Toutes les classes</option>` : "";
  html += NEXI_CLASSES.map((c) => `<option value="${c}">${c}</option>`).join("");
  return html;
}
document.getElementById("classeEnfant").innerHTML = optionsClasses(false);
document.getElementById("classeDefi").innerHTML = optionsClasses(true);
document.getElementById("classeImport").innerHTML = optionsClasses(true);

/* ---------- Onglets ---------- */
document.querySelectorAll(".onglet").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".onglet").forEach((b) => b.classList.remove("actif-onglet"));
    document.querySelectorAll(".panneau").forEach((p) => p.classList.remove("visible"));
    btn.classList.add("actif-onglet");
    document.getElementById("panneau-" + btn.dataset.onglet).classList.add("visible");
  });
});

/* =========================================================
   ENFANTS
   ========================================================= */
async function rafraichirTableauEnfants() {
  const corps = document.getElementById("tableauEnfants");
  try {
    const enfants = await nexiAdminListerEnfants(motDePasseAdmin);
    if (!enfants || enfants.length === 0) {
      corps.innerHTML = `<tr><td colspan="5">Aucun enfant inscrit pour le moment.</td></tr>`;
      return;
    }
    corps.innerHTML = enfants
      .map((c) => {
        const nom = c.nom || c.Nom;
        const identifiant = c.identifiant || c.Identifiant;
        const classe = c.classe || c.Classe || "—";
        const actif = c.actif === true || c.actif === "TRUE" || c.actif === "VRAI" || c.Actif === true || c.Actif === "TRUE" || c.Actif === "VRAI";
        const id = c.id || c.ID;
        return `
        <tr>
          <td>${nom}</td><td>${identifiant}</td><td>${classe}</td>
          <td><span class="badge ${actif ? "badge-actif" : "badge-inactif"}">${actif ? "Actif" : "Inactif"}</span></td>
          <td>
            <button class="btn btn-petit ${actif ? "btn-fantome" : "btn-jungle"}" onclick="basculerActifEnfant('${id}')">${actif ? "Rendre inactif" : "Rendre actif"}</button>
            <button class="btn btn-petit btn-fantome" onclick="supprimerEnfant('${id}')">Supprimer</button>
          </td>
        </tr>`;
      })
      .join("");
  } catch (e) {
    corps.innerHTML = `<tr><td colspan="5" class="erreur">Impossible de charger les enfants.</td></tr>`;
  }
}
async function basculerActifEnfant(id) { await nexiAdminBasculerEnfant(motDePasseAdmin, id); rafraichirTableauEnfants(); }
async function supprimerEnfant(id) {
  if (confirm("Supprimer définitivement cet enfant ?")) { await nexiAdminSupprimerEnfant(motDePasseAdmin, id); rafraichirTableauEnfants(); }
}

document.getElementById("formAjoutEnfant").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nom = document.getElementById("nomEnfant").value.trim();
  const identifiant = document.getElementById("identifiantEnfant").value.trim();
  const classe = document.getElementById("classeEnfant").value;
  const finAbonnement = document.getElementById("finAbonnement").value;
  const erreurDiv = document.getElementById("erreurEnfant");
  erreurDiv.innerHTML = "";
  if (!nom || !identifiant) return;

  const resultat = await nexiAdminAjouterEnfant(motDePasseAdmin, { nom, identifiant, classe, finAbonnement });
  if (resultat && resultat.ok === false) {
    erreurDiv.innerHTML = `<div class="erreur">${resultat.erreur || "Impossible d'ajouter cet enfant."}</div>`;
    return;
  }
  e.target.reset();
  document.getElementById("classeEnfant").innerHTML = optionsClasses(false);
  rafraichirTableauEnfants();
});

/* =========================================================
   DEFIS — création manuelle (avec matière + temps par question)
   ========================================================= */
let compteurBlocs = 0;
function ajouterBlocQuestion() {
  compteurBlocs += 1;
  const id = "bloc" + compteurBlocs;
  const div = document.createElement("div");
  div.className = "bloc-question";
  div.id = id;
  div.innerHTML = `
    <label>Question</label>
    <input type="text" class="q-texte" placeholder="Ex : Quelle est la capitale de la France ?" />
    <div class="ligne-form">
      <div><label>Option 1 (bonne réponse par défaut)</label><input type="text" class="q-opt" /></div>
      <div><label>Option 2</label><input type="text" class="q-opt" /></div>
      <div><label>Option 3</label><input type="text" class="q-opt" /></div>
      <div><label>Option 4</label><input type="text" class="q-opt" /></div>
    </div>
    <div class="ligne-form">
      <div><label>Numéro de la bonne réponse (1 à 4)</label><input type="number" class="q-bonne" min="1" max="4" value="1" /></div>
      <div><label>Matière (optionnel)</label><input type="text" class="q-matiere" placeholder="Ex : Mathématiques, Logique..." /></div>
    </div>
    <label>Temps pour cette question (secondes — laisse vide pour le temps par défaut)</label>
    <input type="number" class="q-temps" min="5" max="180" placeholder="Ex : 15" style="max-width:140px;" />
    <label>Explication de NexiBot (optionnel — affichée après la réponse)</label>
    <input type="text" class="q-explication" placeholder="Ex : 1 base + 4 faces triangulaires = 5 faces !" />
    <button type="button" class="btn btn-petit btn-fantome" onclick="document.getElementById('${id}').remove()">Supprimer cette question</button>
  `;
  document.getElementById("zoneQuestionsForm").appendChild(div);
}
ajouterBlocQuestion();

document.getElementById("formDefi").addEventListener("submit", async (e) => {
  e.preventDefault();
  const titre = document.getElementById("titreDefi").value.trim();
  const classe = document.getElementById("classeDefi").value;
  const temps = parseInt(document.getElementById("tempsDefi").value, 10) || 20;
  const semaine = document.getElementById("semaineDefi").value.trim();

  const questions = [];
  document.querySelectorAll("#zoneQuestionsForm .bloc-question").forEach((bloc) => {
    const question = bloc.querySelector(".q-texte").value.trim();
    const options = Array.from(bloc.querySelectorAll(".q-opt")).map((i) => i.value.trim());
    const bonneReponse = (parseInt(bloc.querySelector(".q-bonne").value, 10) || 1) - 1;
    const matiere = bloc.querySelector(".q-matiere").value.trim();
    const tempsQuestionVal = bloc.querySelector(".q-temps").value.trim();
    const tempsQuestion = tempsQuestionVal ? parseInt(tempsQuestionVal, 10) : null;
    const explication = bloc.querySelector(".q-explication").value.trim();
    if (question && options.every((o) => o)) questions.push({ question, options, bonneReponse, matiere, tempsQuestion, explication });
  });

  if (!titre || questions.length === 0) { alert("Ajoute un titre et au moins une question complète."); return; }

  await nexiAdminAjouterDefi(motDePasseAdmin, { titre, classe, tempsParQuestion: temps, semaine, questions });
  e.target.reset();
  document.getElementById("classeDefi").innerHTML = optionsClasses(true);
  document.getElementById("zoneQuestionsForm").innerHTML = "";
  ajouterBlocQuestion();
  rafraichirTableauDefis();
});

/* ---------- Import CSV : question;option1;option2;option3;option4;index;explication;matiere;tempsQuestion ---------- */
function parseCSVQuestions(text) {
  const lignes = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const questions = [];
  for (const ligne of lignes) {
    if (ligne.toLowerCase().startsWith("question;")) continue;
    const parts = ligne.split(";").map((p) => p.trim());
    if (parts.length < 6) continue;
    const [question, o1, o2, o3, o4, idx, explication, matiere, tempsQuestion] = parts;
    questions.push({
      question, options: [o1, o2, o3, o4], bonneReponse: parseInt(idx, 10) || 0,
      explication: explication || "", matiere: matiere || "",
      tempsQuestion: tempsQuestion ? parseInt(tempsQuestion, 10) : null,
    });
  }
  return questions;
}

function importerCSV() {
  const fichier = document.getElementById("fichierCSV").files[0];
  const titre = document.getElementById("titreImport").value.trim();
  const classe = document.getElementById("classeImport").value;
  const temps = parseInt(document.getElementById("tempsImport").value, 10) || 20;
  if (!fichier || !titre) { alert("Choisis un fichier CSV et donne un titre au défi."); return; }

  const lecteur = new FileReader();
  lecteur.onload = async () => {
    const questions = parseCSVQuestions(lecteur.result);
    if (questions.length === 0) { alert("Le fichier CSV n'a pas pu être lu. Vérifie le modèle."); return; }
    await nexiAdminAjouterDefi(motDePasseAdmin, { titre, classe, tempsParQuestion: temps, questions });
    document.getElementById("fichierCSV").value = "";
    document.getElementById("titreImport").value = "";
    rafraichirTableauDefis();
    alert(`Défi "${titre}" importé avec ${questions.length} question(s) !`);
  };
  lecteur.readAsText(fichier, "UTF-8");
}

/* ---------- Tableau des défis ---------- */
async function rafraichirTableauDefis() {
  const corps = document.getElementById("tableauDefis");
  try {
    const defis = await nexiAdminListerDefis(motDePasseAdmin);
    if (!defis || defis.length === 0) { corps.innerHTML = `<tr><td colspan="5">Aucun défi pour le moment.</td></tr>`; return; }
    corps.innerHTML = defis
      .map((d) => {
        const id = d.id || d.ID;
        const titre = d.titre || d.Titre;
        const classe = d.classe || d.Classe || "Toutes";
        const nbQuestions = (d.questions && d.questions.length) ?? "—";
        const actif = d.actif === true || d.actif === "TRUE" || d.actif === "VRAI" || d.Actif === true || d.Actif === "TRUE" || d.Actif === "VRAI";
        return `
        <tr>
          <td>${titre}</td><td>${classe}</td><td>${nbQuestions}</td>
          <td><span class="badge ${actif ? "badge-actif" : "badge-inactif"}">${actif ? "Visible" : "Masqué"}</span></td>
          <td>
            <button class="btn btn-petit ${actif ? "btn-fantome" : "btn-jungle"}" onclick="basculerActifDefi('${id}')">${actif ? "Masquer" : "Rendre visible"}</button>
            <button class="btn btn-petit btn-fantome" onclick="supprimerDefi('${id}')">Supprimer</button>
          </td>
        </tr>`;
      })
      .join("");
  } catch (e) {
    corps.innerHTML = `<tr><td colspan="5" class="erreur">Impossible de charger les défis.</td></tr>`;
  }
}
async function basculerActifDefi(id) { await nexiAdminBasculerDefi(motDePasseAdmin, id); rafraichirTableauDefis(); }
async function supprimerDefi(id) {
  if (confirm("Supprimer définitivement ce défi ?")) { await nexiAdminSupprimerDefi(motDePasseAdmin, id); rafraichirTableauDefis(); }
}

/* =========================================================
   RESULTATS
   ========================================================= */
async function rafraichirTableauResultats() {
  const corps = document.getElementById("tableauResultats");
  try {
    const resultats = await nexiAdminListerResultats(motDePasseAdmin);
    if (!resultats || resultats.length === 0) { corps.innerHTML = `<tr><td colspan="4">Aucun résultat enregistré pour le moment.</td></tr>`; return; }
    corps.innerHTML = resultats
      .map((r) => {
        const date = r.Date || r.date;
        const nom = r.EnfantNom || r.enfantNom;
        const titre = r.DefiTitre || r.defiTitre;
        const score = r.Score ?? r.score;
        const total = r.Total ?? r.total;
        return `<tr><td>${new Date(date).toLocaleString("fr-FR")}</td><td>${nom}</td><td>${titre}</td><td>${score} / ${total}</td></tr>`;
      })
      .join("");
  } catch (e) {
    corps.innerHTML = `<tr><td colspan="4" class="erreur">Impossible de charger les résultats.</td></tr>`;
  }
}

/* =========================================================
   REGLAGES
   ========================================================= */
document.getElementById("formMotDePasse").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nouveau = document.getElementById("nouveauMdp").value;
  await nexiAdminChangerMotDePasse(motDePasseAdmin, nouveau);
  sessionStorage.setItem("nexi_admin_mdp", nouveau);
  document.getElementById("erreurReglages").innerHTML = '<div class="info">Mot de passe mis à jour !</div>';
  e.target.reset();
});

/* ---------- Chargement initial ---------- */
rafraichirTableauEnfants();
rafraichirTableauDefis();
rafraichirTableauResultats();
