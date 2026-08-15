/* =========================================================================
   API.JS — couche unique utilisée par toutes les pages du site.
   Bascule automatiquement démo (store.js) / connecté (Google Sheets).
   ========================================================================= */

const NEXI_MODE_API = !!(NEXI_CONFIG.APPS_SCRIPT_URL && NEXI_CONFIG.APPS_SCRIPT_URL.trim());

async function apiGet(action, params = {}) {
  const url = new URL(NEXI_CONFIG.APPS_SCRIPT_URL);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Erreur réseau (" + res.status + ")");
  return res.json();
}
async function apiPost(action, payload = {}) {
  const res = await fetch(NEXI_CONFIG.APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // évite le pré-vol CORS
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) throw new Error("Erreur réseau (" + res.status + ")");
  return res.json();
}

/* ---------- Enfant : connexion ---------- */
async function nexiVerifierEnfant(identifiant) {
  if (NEXI_MODE_API) return apiGet("verifierEnfant", { identifiant });
  return demoStore.verifierEnfant(identifiant);
}

/* ---------- Défis actifs (filtrés par classe) ---------- */
async function nexiListerDefis(classe) {
  if (NEXI_MODE_API) {
    const data = await apiGet("listerDefis", classe ? { classe } : {});
    return data.defis || [];
  }
  return demoStore.listerDefisActifs(classe);
}

/* ---------- Enregistrer un résultat (avec détail des réponses) ---------- */
async function nexiEnregistrerResultat(r) {
  if (NEXI_MODE_API) return apiPost("enregistrerResultat", r);
  return demoStore.enregistrerResultat(r);
}

/* ---------- Classement / tableau d'honneur ---------- */
async function nexiClassement(defiId) {
  if (NEXI_MODE_API) {
    const data = await apiGet("classement", defiId ? { defiId } : {});
    return data.classement || [];
  }
  return demoStore.classement();
}

/* ---------- Historique + série d'un enfant ---------- */
async function nexiHistorique(identifiant) {
  if (NEXI_MODE_API) {
    const data = await apiGet("historique", { identifiant });
    return { resultats: data.resultats || [], serie: data.serie || 0 };
  }
  return demoStore.historique(identifiant);
}

/* ---------- "Mon profil" : Quotient de Croissance + par matière ---------- */
async function nexiMonProfil(identifiant) {
  if (NEXI_MODE_API) return apiGet("monProfil", { identifiant });
  return demoStore.monProfil(identifiant);
}

/* ---------- Admin ---------- */
async function nexiAdminLogin(motDePasse) {
  if (NEXI_MODE_API) { const data = await apiPost("adminLogin", { motDePasse }); return !!data.ok; }
  return demoStore.adminLogin(motDePasse);
}
async function nexiAdminListerEnfants(motDePasse) {
  if (NEXI_MODE_API) { const data = await apiPost("adminListerEnfants", { motDePasse }); return data.enfants || []; }
  return demoStore.listerEnfants();
}
async function nexiAdminAjouterEnfant(motDePasse, enfant) {
  if (NEXI_MODE_API) return apiPost("adminAjouterEnfant", { motDePasse, ...enfant });
  return demoStore.ajouterEnfant(enfant);
}
async function nexiAdminBasculerEnfant(motDePasse, id) {
  if (NEXI_MODE_API) return apiPost("adminBasculerEnfant", { motDePasse, id });
  return demoStore.basculerEnfant(id);
}
async function nexiAdminSupprimerEnfant(motDePasse, id) {
  if (NEXI_MODE_API) return apiPost("adminSupprimerEnfant", { motDePasse, id });
  return demoStore.supprimerEnfant(id);
}
async function nexiAdminListerDefis(motDePasse) {
  if (NEXI_MODE_API) { const data = await apiPost("adminListerDefis", { motDePasse }); return data.defis || []; }
  return demoStore.listerDefis();
}
async function nexiAdminAjouterDefi(motDePasse, defi) {
  if (NEXI_MODE_API) return apiPost("adminAjouterDefi", { motDePasse, ...defi });
  return demoStore.ajouterDefi(defi);
}
async function nexiAdminBasculerDefi(motDePasse, id) {
  if (NEXI_MODE_API) return apiPost("adminBasculerDefi", { motDePasse, id });
  return demoStore.basculerDefi(id);
}
async function nexiAdminSupprimerDefi(motDePasse, id) {
  if (NEXI_MODE_API) return apiPost("adminSupprimerDefi", { motDePasse, id });
  return demoStore.supprimerDefi(id);
}
async function nexiAdminListerResultats(motDePasse) {
  if (NEXI_MODE_API) { const data = await apiPost("adminListerResultats", { motDePasse }); return data.resultats || []; }
  return demoStore.listerResultats();
}
async function nexiAdminChangerMotDePasse(motDePasse, nouveau) {
  if (NEXI_MODE_API) return apiPost("adminChangerMotDePasse", { motDePasse, nouveau });
  return demoStore.changerMotDePasse(nouveau);
}
