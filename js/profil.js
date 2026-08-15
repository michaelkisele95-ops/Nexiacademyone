/* ============================================================
   PROFIL.JS — affichage du Quotient de Croissance et du profil
   par matière (indicateur pilote simplifié, pas un test clinique)
   ============================================================ */

const enfantProfil = JSON.parse(sessionStorage.getItem("nexi_enfant") || "null");
if (!enfantProfil) window.location.href = "index.html";

const carte = document.getElementById("carteProfil");

function jaugeHTML(label, valeur) {
  const couleur = valeur >= 70 ? "var(--vert)" : valeur >= 40 ? "var(--or)" : "var(--rouge)";
  return `
    <div style="margin-bottom:14px;">
      <div style="display:flex; justify-content:space-between; font-weight:700; margin-bottom:4px;">
        <span>${label}</span><span>${valeur}/100</span>
      </div>
      <div class="barre-temps-fond" style="max-width:none;">
        <div style="height:100%; width:${valeur}%; background:${couleur}; border-radius:999px;"></div>
      </div>
    </div>`;
}

(async function chargerProfil() {
  try {
    const data = await nexiMonProfil(enfantProfil.identifiant);

    if (!data.ok) {
      carte.innerHTML = `<div class="erreur">Impossible de charger ton profil pour le moment.</div>`;
      return;
    }

    if (data.nbDefis === 0) {
      carte.innerHTML = `
        <h2>Salut ${data.nom || enfantProfil.nom} !</h2>
        <div class="info">${data.message}</div>`;
      return;
    }

    const qc = data.quotientCroissance;
    const sujetsHTML = (data.parSujet || [])
      .map((s) => jaugeHTML(s.matiere, s.pourcentage))
      .join("");

    const historiqueHTML = (data.historique || [])
      .slice(-6)
      .map((h) => `<div class="classement-ligne"><div class="nom">${h.titre}</div><div class="pct">${h.pourcentage}%</div></div>`)
      .join("");

    carte.innerHTML = `
      <h2>Salut ${data.nom} ! 👋</h2>
      <p style="opacity:0.8;">${data.classe ? `Classe ${data.classe} · ` : ""}${data.nbDefis} défi(s) complété(s)</p>

      <div class="badge-niveau badge-or" style="margin:10px 0 18px;">${qc.niveauTexte} — ${qc.global}/100</div>

      <h3>Ton Quotient de Croissance</h3>
      <p style="font-size:13px; opacity:0.75; margin-top:-8px;">
        Un indicateur maison, pas un test de QI : il mesure ta régularité,
        ta progression, ta constance et ta capacité à rebondir — pas juste
        tes bonnes réponses.
      </p>
      ${jaugeHTML("Régularité", qc.regularite)}
      ${jaugeHTML("Progression", qc.progression)}
      ${jaugeHTML("Constance", qc.constance)}
      ${jaugeHTML("Résilience", qc.resilience)}

      ${sujetsHTML ? `<h3 style="margin-top:26px;">Tes scores par matière</h3>${sujetsHTML}` : ""}

      ${historiqueHTML ? `<h3 style="margin-top:26px;">Tes derniers défis</h3>${historiqueHTML}` : ""}
    `;
  } catch (e) {
    carte.innerHTML = `<div class="erreur">Impossible de contacter le serveur. Réessaie dans quelques instants 🔌</div>`;
  }
})();
