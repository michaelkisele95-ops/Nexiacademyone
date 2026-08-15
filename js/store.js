/* =========================================================================
   STORE.JS — mode démo local (localStorage)
   Actif uniquement quand NEXI_CONFIG.APPS_SCRIPT_URL est vide.
   Même logique que Code.gs (classes, matières, temps par question, profil)
   pour que le mode démo et le mode connecté se comportent pareil.
   ========================================================================= */

const NEXI_CLASSES = ["G", "F", "E", "D", "C", "B", "A", "S"];

const DEMO_KEYS = {
  PASS: "nexi_demo_pass",
  ENFANTS: "nexi_demo_enfants",
  DEFIS: "nexi_demo_defis",
  RESULTATS: "nexi_demo_resultats",
  REPONSES: "nexi_demo_reponses",
};

function demoLoad(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch (e) { return fallback; }
}
function demoSave(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function demoUid(prefix) { return prefix + "_" + Math.random().toString(36).slice(2, 9); }

function demoInit() {
  if (localStorage.getItem(DEMO_KEYS.PASS) === null) {
    demoSave(DEMO_KEYS.PASS, NEXI_CONFIG.MOT_DE_PASSE_DEMO || "tresor2026");
  }
  if (localStorage.getItem(DEMO_KEYS.ENFANTS) === null) {
    demoSave(DEMO_KEYS.ENFANTS, [
      { id: demoUid("enf"), nom: "Léo", identifiant: "LEO123", classe: "C", actif: true, finAbonnement: "" },
      { id: demoUid("enf"), nom: "Mia", identifiant: "MIA456", classe: "C", actif: true, finAbonnement: "" },
    ]);
  }
  if (localStorage.getItem(DEMO_KEYS.DEFIS) === null) {
    demoSave(DEMO_KEYS.DEFIS, [
      {
        id: demoUid("defi"),
        titre: "Défi de la semaine — Logique & Sciences",
        classe: "C",
        semaine: "S1",
        tempsParQuestion: 20,
        actif: true,
        questions: [
          {
            question: "Combien de faces a une pyramide à base carrée ?",
            options: ["4", "5", "6", "8"], bonneReponse: 1,
            explication: "1 base carrée + 4 faces triangulaires = 5 faces au total !",
            matiere: "Logique", tempsQuestion: 20,
          },
          {
            question: "Quel est le plus grand océan du monde ?",
            options: ["Atlantique", "Pacifique", "Indien", "Arctique"], bonneReponse: 1,
            explication: "L'océan Pacifique couvre environ un tiers de la surface de la Terre !",
            matiere: "Sciences", tempsQuestion: 15,
          },
          {
            question: "Combien font 12 × 12 ?",
            options: ["124", "144", "132", "142"], bonneReponse: 1,
            explication: "12 × 12 = 144.",
            matiere: "Mathématiques", tempsQuestion: 30,
          },
        ],
      },
    ]);
  }
  if (localStorage.getItem(DEMO_KEYS.RESULTATS) === null) demoSave(DEMO_KEYS.RESULTATS, []);
  if (localStorage.getItem(DEMO_KEYS.REPONSES) === null) demoSave(DEMO_KEYS.REPONSES, []);
}
demoInit();

/* ---------- API interne du mode démo (mêmes signatures que api.js) ---------- */
const demoStore = {
  verifierEnfant(identifiant) {
    const clean = (identifiant || "").trim().toUpperCase();
    const enfant = demoLoad(DEMO_KEYS.ENFANTS, []).find((e) => e.identifiant.toUpperCase() === clean);
    if (!enfant) return { existe: false };
    return { existe: true, actif: enfant.actif, id: enfant.id, nom: enfant.nom, classe: enfant.classe || "" };
  },
  listerDefisActifs(classe) {
    const classeClean = (classe || "").trim().toUpperCase();
    return demoLoad(DEMO_KEYS.DEFIS, []).filter((d) => {
      if (!d.actif) return false;
      if (!classeClean) return true;
      const c = (d.classe || "").trim().toUpperCase();
      return c === "" || c === "TOUTES" || c === classeClean;
    });
  },
  enregistrerResultat(r) {
    const liste = demoLoad(DEMO_KEYS.RESULTATS, []);
    const maintenant = new Date().toISOString();
    liste.push({ Date: maintenant, EnfantID: r.enfantId, EnfantNom: r.enfantNom, DefiID: r.defiId, DefiTitre: r.defiTitre, Score: r.score, Total: r.total });
    demoSave(DEMO_KEYS.RESULTATS, liste);

    if (Array.isArray(r.reponses)) {
      const reponses = demoLoad(DEMO_KEYS.REPONSES, []);
      r.reponses.forEach((rep) => {
        reponses.push({ Date: maintenant, EnfantID: r.enfantId, DefiID: r.defiId, QuestionOrdre: rep.ordre, Matiere: rep.matiere || "", Correct: !!rep.correct, TempsPris: rep.tempsPris || "" });
      });
      demoSave(DEMO_KEYS.REPONSES, reponses);
    }
    return { ok: true };
  },
  classement() {
    const resultats = demoLoad(DEMO_KEYS.RESULTATS, []);
    return resultats
      .map((r) => ({ nom: r.EnfantNom, score: r.Score, total: r.Total, pourcentage: Math.round((r.Score / r.Total) * 100) }))
      .sort((a, b) => b.pourcentage - a.pourcentage)
      .slice(0, 10);
  },
  historique(identifiant) {
    const enfant = this.verifierEnfant(identifiant);
    if (!enfant.existe) return { resultats: [], serie: 0 };
    const resultats = demoLoad(DEMO_KEYS.RESULTATS, []).filter((r) => r.EnfantID === enfant.id);
    return { resultats, serie: resultats.length };
  },
  monProfil(identifiant) {
    const enfant = this.verifierEnfant(identifiant);
    if (!enfant.existe) return { ok: false, erreur: "Enfant introuvable" };
    const resultats = demoLoad(DEMO_KEYS.RESULTATS, []).filter((r) => r.EnfantID === enfant.id)
      .sort((a, b) => new Date(a.Date) - new Date(b.Date));
    const reponses = demoLoad(DEMO_KEYS.REPONSES, []).filter((r) => r.EnfantID === enfant.id);

    if (resultats.length === 0) {
      return { ok: true, nom: enfant.nom, classe: enfant.classe, nbDefis: 0, parSujet: [], quotientCroissance: null, message: "Pas encore de défi complété — reviens après ta première participation !" };
    }
    const pourcentages = resultats.map((r) => (r.Score / r.Total) * 100);

    const parMatiere = {};
    reponses.forEach((r) => {
      const m = r.Matiere || "Général";
      if (!parMatiere[m]) parMatiere[m] = { total: 0, correctes: 0 };
      parMatiere[m].total += 1;
      if (r.Correct) parMatiere[m].correctes += 1;
    });
    const parSujet = Object.keys(parMatiere).map((matiere) => ({
      matiere, pourcentage: Math.round((parMatiere[matiere].correctes / parMatiere[matiere].total) * 100), nbReponses: parMatiere[matiere].total,
    }));

    const premierJour = new Date(resultats[0].Date);
    const dernierJour = new Date(resultats[resultats.length - 1].Date);
    const semaines = Math.max(1, Math.round((dernierJour - premierJour) / (7 * 24 * 3600 * 1000)) + 1);
    const regularite = Math.min(100, Math.round((resultats.length / semaines) * 100));
    const progression = Math.max(0, Math.min(100, Math.round(50 + (pourcentages[pourcentages.length - 1] - pourcentages[0]))));
    let constance = 100;
    if (parSujet.length > 1) {
      const valeurs = parSujet.map((s) => s.pourcentage);
      constance = Math.max(0, 100 - (Math.max(...valeurs) - Math.min(...valeurs)));
    }
    let resilience = 100;
    if (pourcentages.length > 2) {
      let rebonds = 0, occasions = 0;
      for (let i = 1; i < pourcentages.length - 1; i++) {
        if (pourcentages[i] < pourcentages[i - 1]) {
          occasions += 1;
          if (pourcentages[i + 1] > pourcentages[i]) rebonds += 1;
        }
      }
      resilience = occasions > 0 ? Math.round((rebonds / occasions) * 100) : 100;
    }
    const global = Math.round((regularite + progression + constance + resilience) / 4);
    let niveauTexte = "Premiers pas";
    if (global >= 85) niveauTexte = "Croissance exceptionnelle";
    else if (global >= 70) niveauTexte = "Croissance soutenue";
    else if (global >= 50) niveauTexte = "Croissance régulière";

    return {
      ok: true, nom: enfant.nom, classe: enfant.classe, nbDefis: resultats.length, parSujet,
      historique: resultats.map((r) => ({ date: r.Date, titre: r.DefiTitre, pourcentage: Math.round((r.Score / r.Total) * 100) })),
      quotientCroissance: { regularite, progression, constance, resilience, global, niveauTexte },
    };
  },
  adminLogin(pwd) { return demoLoad(DEMO_KEYS.PASS, "") === pwd; },
  listerEnfants() { return demoLoad(DEMO_KEYS.ENFANTS, []); },
  ajouterEnfant(e) {
    const clean = (e.identifiant || "").trim().toUpperCase();
    if (this.listerEnfants().some((c) => c.identifiant.toUpperCase() === clean)) return { ok: false, erreur: "Cet identifiant existe déjà" };
    const liste = this.listerEnfants();
    liste.push({ id: demoUid("enf"), nom: e.nom, identifiant: clean, classe: e.classe || "", actif: true, finAbonnement: e.finAbonnement || "" });
    demoSave(DEMO_KEYS.ENFANTS, liste);
    return { ok: true };
  },
  basculerEnfant(id) {
    demoSave(DEMO_KEYS.ENFANTS, this.listerEnfants().map((c) => (c.id === id ? { ...c, actif: !c.actif } : c)));
    return { ok: true };
  },
  supprimerEnfant(id) { demoSave(DEMO_KEYS.ENFANTS, this.listerEnfants().filter((c) => c.id !== id)); return { ok: true }; },
  listerDefis() { return demoLoad(DEMO_KEYS.DEFIS, []); },
  ajouterDefi(d) {
    const liste = this.listerDefis();
    liste.push({ id: demoUid("defi"), actif: true, ...d });
    demoSave(DEMO_KEYS.DEFIS, liste);
    return { ok: true };
  },
  basculerDefi(id) { demoSave(DEMO_KEYS.DEFIS, this.listerDefis().map((d) => (d.id === id ? { ...d, actif: !d.actif } : d))); return { ok: true }; },
  supprimerDefi(id) { demoSave(DEMO_KEYS.DEFIS, this.listerDefis().filter((d) => d.id !== id)); return { ok: true }; },
  listerResultats() { return demoLoad(DEMO_KEYS.RESULTATS, []).slice().reverse(); },
  changerMotDePasse(nouveau) { demoSave(DEMO_KEYS.PASS, nouveau); return { ok: true }; },
};
