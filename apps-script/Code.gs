/**
 * =========================================================================
 * NEXI ONE — Code.gs (v2)
 * Backend Google Apps Script, à coller dans l'éditeur Apps Script lié à ta
 * Google Sheet "NEXI ONE - Base de données".
 *
 * Nouveautés v2 : classes (G à S), temps par question personnalisable,
 * matière par question, page "Mon profil" avec Quotient de Croissance.
 *
 * Voir GUIDE.md pour la marche à suivre complète, étape par étape.
 * =========================================================================
 */

/* ---------------------------------------------------------------------
   0. CONFIGURATION
   --------------------------------------------------------------------- */
const FEUILLE_ENFANTS = "Enfants";
const FEUILLE_DEFIS = "Defis";
const FEUILLE_QUESTIONS = "Questions";
const FEUILLE_RESULTATS = "Resultats";
const FEUILLE_REPONSES = "Reponses";
const FEUILLE_CONFIG = "Config";

const CLASSES_VALIDES = ["G", "F", "E", "D", "C", "B", "A", "S"];

/* ---------------------------------------------------------------------
   1. INITIALISATION
   --------------------------------------------------------------------- */

/** À lancer UNE FOIS pour une toute nouvelle Google Sheet. */
function configurerFeuilles() {
  const ss = SpreadsheetApp.getActive();

  creerFeuilleSiAbsente(ss, FEUILLE_ENFANTS, [
    "ID", "Nom", "Identifiant", "Classe", "Actif", "FinAbonnement", "Ecole", "Contact", "DateAjout"
  ]);
  creerFeuilleSiAbsente(ss, FEUILLE_DEFIS, [
    "ID", "Titre", "Classe", "Semaine", "TempsParQuestion", "Actif", "DateCreation"
  ]);
  creerFeuilleSiAbsente(ss, FEUILLE_QUESTIONS, [
    "DefiID", "Ordre", "Question", "Option1", "Option2", "Option3", "Option4",
    "BonneReponse", "Explication", "Matiere", "TempsQuestion"
  ]);
  creerFeuilleSiAbsente(ss, FEUILLE_RESULTATS, [
    "Date", "EnfantID", "EnfantNom", "DefiID", "DefiTitre", "Score", "Total"
  ]);
  creerFeuilleSiAbsente(ss, FEUILLE_REPONSES, [
    "Date", "EnfantID", "DefiID", "QuestionOrdre", "Matiere", "Correct", "TempsPris"
  ]);
  creerFeuilleSiAbsente(ss, FEUILLE_CONFIG, ["Cle", "Valeur"]);

  if (!lireConfig("AdminMotDePasse")) ecrireConfig("AdminMotDePasse", "tresor2026");

  SpreadsheetApp.getUi().alert(
    "Feuilles prêtes ! Mot de passe admin par défaut : tresor2026 (à changer depuis le site, onglet Réglages)."
  );
}

/**
 * À lancer UNE FOIS si tu avais déjà une Google Sheet créée avec la
 * v1 de NEXI ONE : ajoute les nouvelles colonnes (Classe, Matiere,
 * TempsQuestion...) sans toucher à tes données existantes.
 */
function mettreAJourFeuillesV2() {
  const ss = SpreadsheetApp.getActive();
  assurerColonnes(ss, FEUILLE_ENFANTS, ["ID", "Nom", "Identifiant", "Classe", "Actif", "FinAbonnement", "Ecole", "Contact", "DateAjout"]);
  assurerColonnes(ss, FEUILLE_DEFIS, ["ID", "Titre", "Classe", "Semaine", "TempsParQuestion", "Actif", "DateCreation"]);
  assurerColonnes(ss, FEUILLE_QUESTIONS, ["DefiID", "Ordre", "Question", "Option1", "Option2", "Option3", "Option4", "BonneReponse", "Explication", "Matiere", "TempsQuestion"]);
  creerFeuilleSiAbsente(ss, FEUILLE_REPONSES, ["Date", "EnfantID", "DefiID", "QuestionOrdre", "Matiere", "Correct", "TempsPris"]);
  SpreadsheetApp.getUi().alert("Mise à jour terminée ! Tes onglets ont les nouvelles colonnes (Classe, Matiere, TempsQuestion...).");
}

function creerFeuilleSiAbsente(ss, nom, entetes) {
  let feuille = ss.getSheetByName(nom);
  if (!feuille) {
    feuille = ss.insertSheet(nom);
    feuille.appendRow(entetes);
    feuille.setFrozenRows(1);
  }
}

/** Ajoute à la fin les colonnes manquantes d'une feuille existante, sans rien supprimer. */
function assurerColonnes(ss, nom, entetesVoulues) {
  const feuille = ss.getSheetByName(nom);
  if (!feuille) { creerFeuilleSiAbsente(ss, nom, entetesVoulues); return; }
  const entetesActuelles = feuille.getRange(1, 1, 1, Math.max(1, feuille.getLastColumn())).getValues()[0];
  entetesVoulues.forEach((entete) => {
    if (entetesActuelles.indexOf(entete) === -1) {
      feuille.getRange(1, feuille.getLastColumn() + 1).setValue(entete);
    }
  });
}

/* ---------------------------------------------------------------------
   2. POINT D'ENTRÉE HTTP
   --------------------------------------------------------------------- */
function doGet(e) {
  try {
    const action = e.parameter.action;
    let resultat;
    switch (action) {
      case "ping": resultat = { ok: true, message: "NEXI ONE API en ligne" }; break;
      case "verifierEnfant": resultat = verifierEnfant(e.parameter.identifiant); break;
      case "listerDefis": resultat = listerDefisActifs(e.parameter.classe); break;
      case "classement": resultat = classementSemaine(e.parameter.defiId); break;
      case "historique": resultat = historiqueEnfant(e.parameter.identifiant); break;
      case "monProfil": resultat = calculerProfil(e.parameter.identifiant); break;
      default: resultat = { ok: false, erreur: "Action GET inconnue: " + action };
    }
    return reponseJSON(resultat);
  } catch (err) {
    return reponseJSON({ ok: false, erreur: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    let resultat;

    switch (action) {
      case "enregistrerResultat": resultat = enregistrerResultat(body); break;
      case "adminLogin": resultat = { ok: verifierMotDePasse(body.motDePasse) }; break;
      case "adminListerEnfants": verifierAdminOuLever(body.motDePasse); resultat = { ok: true, enfants: listerEnfants() }; break;
      case "adminAjouterEnfant": verifierAdminOuLever(body.motDePasse); resultat = ajouterEnfant(body); break;
      case "adminBasculerEnfant": verifierAdminOuLever(body.motDePasse); resultat = basculerEnfant(body.id); break;
      case "adminSupprimerEnfant": verifierAdminOuLever(body.motDePasse); resultat = supprimerLigne(FEUILLE_ENFANTS, body.id); break;
      case "adminListerDefis": verifierAdminOuLever(body.motDePasse); resultat = { ok: true, defis: listerDefisAvecQuestions(false) }; break;
      case "adminAjouterDefi": verifierAdminOuLever(body.motDePasse); resultat = ajouterDefi(body); break;
      case "adminBasculerDefi": verifierAdminOuLever(body.motDePasse); resultat = basculerDefi(body.id); break;
      case "adminSupprimerDefi": verifierAdminOuLever(body.motDePasse); resultat = supprimerDefiEtQuestions(body.id); break;
      case "adminListerResultats": verifierAdminOuLever(body.motDePasse); resultat = { ok: true, resultats: listerResultats() }; break;
      case "adminChangerMotDePasse": verifierAdminOuLever(body.motDePasse); ecrireConfig("AdminMotDePasse", body.nouveau); resultat = { ok: true }; break;
      default: resultat = { ok: false, erreur: "Action POST inconnue: " + action };
    }
    return reponseJSON(resultat);
  } catch (err) {
    return reponseJSON({ ok: false, erreur: String(err) });
  }
}

function reponseJSON(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------------------------------------------------------------------
   3. CONFIG / ADMIN
   --------------------------------------------------------------------- */
function lireConfig(cle) {
  const feuille = SpreadsheetApp.getActive().getSheetByName(FEUILLE_CONFIG);
  const donnees = feuille.getDataRange().getValues();
  for (let i = 1; i < donnees.length; i++) if (donnees[i][0] === cle) return donnees[i][1];
  return null;
}
function ecrireConfig(cle, valeur) {
  const feuille = SpreadsheetApp.getActive().getSheetByName(FEUILLE_CONFIG);
  const donnees = feuille.getDataRange().getValues();
  for (let i = 1; i < donnees.length; i++) {
    if (donnees[i][0] === cle) { feuille.getRange(i + 1, 2).setValue(valeur); return; }
  }
  feuille.appendRow([cle, valeur]);
}
function verifierMotDePasse(pwd) { return lireConfig("AdminMotDePasse") === pwd; }
function verifierAdminOuLever(pwd) { if (!verifierMotDePasse(pwd)) throw new Error("Mot de passe administrateur incorrect"); }

/* ---------------------------------------------------------------------
   4. ENFANTS
   --------------------------------------------------------------------- */
function feuilleVersObjets(nomFeuille) {
  const feuille = SpreadsheetApp.getActive().getSheetByName(nomFeuille);
  const donnees = feuille.getDataRange().getValues();
  const entetes = donnees[0];
  const lignes = [];
  for (let i = 1; i < donnees.length; i++) {
    if (donnees[i].join("") === "") continue;
    const obj = { _ligne: i + 1 };
    entetes.forEach((cle, j) => (obj[cle] = donnees[i][j]));
    lignes.push(obj);
  }
  return lignes;
}

function listerEnfants() { return feuilleVersObjets(FEUILLE_ENFANTS); }

function verifierEnfant(identifiant) {
  if (!identifiant) return { existe: false };
  const clean = String(identifiant).trim().toUpperCase();
  const enfant = listerEnfants().find((e) => String(e.Identifiant).trim().toUpperCase() === clean);
  if (!enfant) return { existe: false };
  return {
    existe: true,
    actif: estVrai(enfant.Actif),
    id: enfant.ID,
    nom: enfant.Nom,
    classe: enfant.Classe || "",
  };
}

function estVrai(valeur) { return valeur === true || valeur === "TRUE" || valeur === "VRAI"; }
function genererId(prefixe) { return prefixe + "_" + Utilities.getUuid().slice(0, 8); }

function ajouterEnfant(body) {
  const clean = String(body.identifiant || "").trim().toUpperCase();
  if (!clean || !body.nom) return { ok: false, erreur: "Nom et identifiant requis" };
  if (listerEnfants().some((e) => String(e.Identifiant).trim().toUpperCase() === clean)) {
    return { ok: false, erreur: "Cet identifiant existe déjà" };
  }
  const feuille = SpreadsheetApp.getActive().getSheetByName(FEUILLE_ENFANTS);
  const id = genererId("enf");
  feuille.appendRow([
    id, body.nom, clean, body.classe || "", true, body.finAbonnement || "",
    body.ecole || "", body.contact || "", new Date(),
  ]);
  return { ok: true, id };
}

function basculerEnfant(id) {
  const feuille = SpreadsheetApp.getActive().getSheetByName(FEUILLE_ENFANTS);
  const donnees = feuille.getDataRange().getValues();
  const entetes = donnees[0];
  const colActif = entetes.indexOf("Actif") + 1;
  for (let i = 1; i < donnees.length; i++) {
    if (donnees[i][0] === id) {
      feuille.getRange(i + 1, colActif).setValue(!donnees[i][colActif - 1]);
      return { ok: true };
    }
  }
  return { ok: false, erreur: "Enfant introuvable" };
}

function supprimerLigne(nomFeuille, id) {
  const feuille = SpreadsheetApp.getActive().getSheetByName(nomFeuille);
  const donnees = feuille.getDataRange().getValues();
  for (let i = 1; i < donnees.length; i++) {
    if (donnees[i][0] === id) { feuille.deleteRow(i + 1); return { ok: true }; }
  }
  return { ok: false, erreur: "Ligne introuvable" };
}

/* ---------------------------------------------------------------------
   5. DEFIS + QUESTIONS (avec classe, matière, temps par question)
   --------------------------------------------------------------------- */
function listerDefisAvecQuestions(seulementActifs, classe) {
  const defis = feuilleVersObjets(FEUILLE_DEFIS);
  const questions = feuilleVersObjets(FEUILLE_QUESTIONS);
  const classeClean = classe ? String(classe).trim().toUpperCase() : "";

  return defis
    .filter((d) => !seulementActifs || estVrai(d.Actif))
    .filter((d) => {
      if (!classeClean) return true; // pas de filtre demandé (ex: admin)
      const classeDefi = String(d.Classe || "").trim().toUpperCase();
      return classeDefi === "" || classeDefi === "TOUTES" || classeDefi === classeClean;
    })
    .map((d) => {
      const questionsDefi = questions
        .filter((q) => q.DefiID === d.ID)
        .sort((a, b) => (Number(a.Ordre) || 0) - (Number(b.Ordre) || 0))
        .map((q) => ({
          question: q.Question,
          options: [q.Option1, q.Option2, q.Option3, q.Option4],
          bonneReponse: Number(q.BonneReponse),
          explication: q.Explication || "",
          matiere: q.Matiere || "",
          // Temps spécifique à la question, sinon on retombe sur le temps par défaut du défi
          tempsQuestion: Number(q.TempsQuestion) || Number(d.TempsParQuestion) || 20,
        }));
      return {
        id: d.ID,
        titre: d.Titre,
        classe: d.Classe || "",
        semaine: d.Semaine || "",
        tempsParQuestion: Number(d.TempsParQuestion) || 20,
        actif: estVrai(d.Actif),
        questions: questionsDefi,
      };
    });
}
function listerDefisActifs(classe) { return { ok: true, defis: listerDefisAvecQuestions(true, classe) }; }

function ajouterDefi(body) {
  const feuilleDefis = SpreadsheetApp.getActive().getSheetByName(FEUILLE_DEFIS);
  const feuilleQuestions = SpreadsheetApp.getActive().getSheetByName(FEUILLE_QUESTIONS);
  const id = genererId("defi");

  feuilleDefis.appendRow([
    id, body.titre, body.classe || "", body.semaine || "", body.tempsParQuestion || 20, true, new Date(),
  ]);

  (body.questions || []).forEach((q, index) => {
    feuilleQuestions.appendRow([
      id, index + 1, q.question, q.options[0], q.options[1], q.options[2], q.options[3],
      q.bonneReponse, q.explication || "", q.matiere || "", q.tempsQuestion || "",
    ]);
  });

  return { ok: true, id };
}

function basculerDefi(id) {
  const feuille = SpreadsheetApp.getActive().getSheetByName(FEUILLE_DEFIS);
  const donnees = feuille.getDataRange().getValues();
  const entetes = donnees[0];
  const colActif = entetes.indexOf("Actif") + 1;
  for (let i = 1; i < donnees.length; i++) {
    if (donnees[i][0] === id) {
      feuille.getRange(i + 1, colActif).setValue(!donnees[i][colActif - 1]);
      return { ok: true };
    }
  }
  return { ok: false, erreur: "Défi introuvable" };
}

function supprimerDefiEtQuestions(id) {
  supprimerLigne(FEUILLE_DEFIS, id);
  const feuille = SpreadsheetApp.getActive().getSheetByName(FEUILLE_QUESTIONS);
  const donnees = feuille.getDataRange().getValues();
  for (let i = donnees.length - 1; i >= 1; i--) {
    if (donnees[i][0] === id) feuille.deleteRow(i + 1);
  }
  return { ok: true };
}

/* ---------------------------------------------------------------------
   6. RESULTATS + REPONSES DETAILLEES
   --------------------------------------------------------------------- */
function enregistrerResultat(body) {
  const feuilleRes = SpreadsheetApp.getActive().getSheetByName(FEUILLE_RESULTATS);
  const maintenant = new Date();
  feuilleRes.appendRow([
    maintenant, body.enfantId, body.enfantNom, body.defiId, body.defiTitre, body.score, body.total,
  ]);

  if (Array.isArray(body.reponses) && body.reponses.length > 0) {
    const feuilleRep = SpreadsheetApp.getActive().getSheetByName(FEUILLE_REPONSES);
    const lignes = body.reponses.map((r) => [
      maintenant, body.enfantId, body.defiId, r.ordre, r.matiere || "", !!r.correct, r.tempsPris || "",
    ]);
    feuilleRep.getRange(feuilleRep.getLastRow() + 1, 1, lignes.length, 7).setValues(lignes);
  }

  return { ok: true };
}

function listerResultats() { return feuilleVersObjets(FEUILLE_RESULTATS).reverse(); }

function classementSemaine(defiId) {
  let resultats = feuilleVersObjets(FEUILLE_RESULTATS);
  if (defiId) {
    resultats = resultats.filter((r) => r.DefiID === defiId);
  } else {
    const ilYA7Jours = new Date();
    ilYA7Jours.setDate(ilYA7Jours.getDate() - 7);
    resultats = resultats.filter((r) => new Date(r.Date) >= ilYA7Jours);
  }
  const classement = resultats
    .map((r) => ({
      nom: r.EnfantNom, score: Number(r.Score), total: Number(r.Total),
      pourcentage: Math.round((Number(r.Score) / Number(r.Total)) * 100),
    }))
    .sort((a, b) => b.pourcentage - a.pourcentage)
    .slice(0, 10);
  return { ok: true, classement };
}

function historiqueEnfant(identifiant) {
  const enfant = verifierEnfant(identifiant);
  if (!enfant.existe) return { ok: false, erreur: "Enfant introuvable" };
  const resultats = feuilleVersObjets(FEUILLE_RESULTATS)
    .filter((r) => r.EnfantID === enfant.id)
    .sort((a, b) => new Date(a.Date) - new Date(b.Date));
  return { ok: true, resultats, serie: resultats.length };
}

/* ---------------------------------------------------------------------
   7. "MON PROFIL" — Quotient de Croissance (indicateur simplifié)
   --------------------------------------------------------------------- */
function calculerProfil(identifiant) {
  const enfant = verifierEnfant(identifiant);
  if (!enfant.existe) return { ok: false, erreur: "Enfant introuvable" };

  const resultats = feuilleVersObjets(FEUILLE_RESULTATS)
    .filter((r) => r.EnfantID === enfant.id)
    .sort((a, b) => new Date(a.Date) - new Date(b.Date));
  const reponses = feuilleVersObjets(FEUILLE_REPONSES).filter((r) => r.EnfantID === enfant.id);

  if (resultats.length === 0) {
    return {
      ok: true, nom: enfant.nom, classe: enfant.classe, nbDefis: 0,
      parSujet: [], quotientCroissance: null,
      message: "Pas encore de défi complété — reviens après ta première participation !",
    };
  }

  const pourcentages = resultats.map((r) => (Number(r.Score) / Number(r.Total)) * 100);

  /* ---- Par matière (à partir des réponses détaillées, si disponibles) ---- */
  const parMatiere = {};
  reponses.forEach((r) => {
    const matiere = r.Matiere || "Général";
    if (!parMatiere[matiere]) parMatiere[matiere] = { total: 0, correctes: 0 };
    parMatiere[matiere].total += 1;
    if (estVrai(r.Correct)) parMatiere[matiere].correctes += 1;
  });
  const parSujet = Object.keys(parMatiere).map((matiere) => ({
    matiere,
    pourcentage: Math.round((parMatiere[matiere].correctes / parMatiere[matiere].total) * 100),
    nbReponses: parMatiere[matiere].total,
  }));

  /* ---- Quotient de Croissance (indicateur simplifié, pas clinique) ---- */
  const premierJour = new Date(resultats[0].Date);
  const dernierJour = new Date(resultats[resultats.length - 1].Date);
  const semainesEcoulees = Math.max(1, Math.round((dernierJour - premierJour) / (7 * 24 * 3600 * 1000)) + 1);
  const regularite = Math.min(100, Math.round((resultats.length / semainesEcoulees) * 100));

  const progressionBrute = pourcentages[pourcentages.length - 1] - pourcentages[0];
  const progression = Math.max(0, Math.min(100, Math.round(50 + progressionBrute)));

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
    ok: true,
    nom: enfant.nom,
    classe: enfant.classe,
    nbDefis: resultats.length,
    parSujet,
    historique: resultats.map((r) => ({
      date: r.Date, titre: r.DefiTitre, pourcentage: Math.round((Number(r.Score) / Number(r.Total)) * 100),
    })),
    quotientCroissance: { regularite, progression, constance, resilience, global, niveauTexte },
  };
}

/* ---------------------------------------------------------------------
   8. LIAISON AVEC UN GOOGLE FORM D'INSCRIPTION (optionnel)
   Voir GUIDE.md. Déclencheur à ajouter : onFormSubmit, "Sur envoi du
   formulaire", depuis cette même feuille de calcul.
   --------------------------------------------------------------------- */
function onFormSubmit(e) {
  try {
    const reponses = e.namedValues;
    // ⚠️ Adapte ces clés EXACTEMENT aux intitulés de tes questions du Google Form
    const nom = valeurForm(reponses, "Prénom de l'enfant");
    const classe = valeurForm(reponses, "Classe");
    const ecole = valeurForm(reponses, "École");
    const contactParent = valeurForm(reponses, "Numéro du parent (WhatsApp)");

    if (!nom) return;

    const identifiant = genererIdentifiantLisible(nom);
    const feuille = SpreadsheetApp.getActive().getSheetByName(FEUILLE_ENFANTS);
    const id = genererId("enf");

    // Actif = FALSE par défaut : à activer manuellement une fois le
    // paiement Mobile Money confirmé.
    feuille.appendRow([id, nom, identifiant, classe, false, "", ecole, contactParent, new Date()]);
  } catch (err) {
    Logger.log("Erreur onFormSubmit : " + err);
  }
}
function valeurForm(reponses, cle) { return reponses[cle] ? reponses[cle][0] : ""; }
function genererIdentifiantLisible(nom) {
  const base = (nom || "ENF").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "ENF";
  return base + Math.floor(100 + Math.random() * 900);
}
