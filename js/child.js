/* Connexion de l'enfant + compte à rebours vers le prochain défi */

document.getElementById("nexibotAccueil").innerHTML = nexibotHTML(nexibotPhrase("bienvenue"));

/* ---------- Compte à rebours vers le prochain défi hebdomadaire ---------- */
function prochainDefi() {
  const maintenant = new Date();
  const cible = new Date();
  cible.setHours(NEXI_CONFIG.HEURE_DEFI || 19, 0, 0, 0);
  let diffJours = (NEXI_CONFIG.JOUR_DEFI || 5) - maintenant.getDay();
  if (diffJours < 0 || (diffJours === 0 && maintenant > cible)) diffJours += 7;
  cible.setDate(maintenant.getDate() + diffJours);
  return cible;
}

function rafraichirCompteARebours() {
  const cible = prochainDefi();
  const diffMs = Math.max(0, cible - new Date());
  const jours = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const heures = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  document.getElementById("compteARebours").innerHTML = `
    <div class="etiquette">⏰ Prochain défi dans</div>
    <div class="valeurs">
      <div class="bloc-temps"><b>${jours}</b><span>jours</span></div>
      <div class="bloc-temps"><b>${heures}</b><span>heures</span></div>
      <div class="bloc-temps"><b>${minutes}</b><span>min</span></div>
    </div>`;
}
rafraichirCompteARebours();
setInterval(rafraichirCompteARebours, 60000);

/* ---------- Connexion ---------- */
const form = document.getElementById("formIdentifiant");
const zoneErreur = document.getElementById("zoneErreur");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  zoneErreur.innerHTML = "";
  const saisie = document.getElementById("identifiant").value.trim();
  const btn = form.querySelector("button");
  if (!saisie) {
    zoneErreur.innerHTML = `<div class="erreur">Écris ton code secret pour continuer 🔑</div>`;
    return;
  }
  btn.disabled = true;
  btn.textContent = "Vérification...";
  try {
    const resultat = await nexiVerifierEnfant(saisie);
    if (!resultat.existe) {
      zoneErreur.innerHTML = `<div class="erreur">Ce code n'existe pas. Vérifie avec un adulte 🧐</div>`;
    } else if (!resultat.actif) {
      zoneErreur.innerHTML = `<div class="erreur">Ton compte est en pause pour le moment. Demande à un adulte de vérifier ton abonnement ⏸️</div>`;
    } else {
      sessionStorage.setItem("nexi_enfant", JSON.stringify({
        id: resultat.id, nom: resultat.nom, identifiant: saisie, classe: resultat.classe || "",
      }));
      window.location.href = "quiz.html";
      return;
    }
  } catch (err) {
    zoneErreur.innerHTML = `<div class="erreur">Impossible de contacter le serveur. Réessaie dans quelques instants 🔌</div>`;
  }
  btn.disabled = false;
  btn.textContent = "Rejoindre mon défi ⚡";
});
