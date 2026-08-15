/* =========================================================================
   CONFIG.JS — le seul réglage indispensable de tout le projet
   =========================================================================
   Tant que APPS_SCRIPT_URL est vide, le site tourne en MODE DÉMO :
   les données restent dans le navigateur (voir store.js), pratique pour
   tester tout de suite dans VS Code sans rien configurer.

   Dès que tu colles ici l'URL de ton Apps Script déployé (voir GUIDE.md,
   partie "Brancher Google Sheets"), le site passe automatiquement en
   MODE CONNECTÉ : toutes les données sont lues et écrites dans ta Google
   Sheet, visibles depuis n'importe quel appareil.
   ========================================================================= */

const NEXI_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzOq5g7Rk9EnluufEn84q7_2qENEpndSp7FDOHUKxaXPIZalME3f439HjISJXiyL4-Y/exec",
  // Mot de passe utilisé UNIQUEMENT tant que APPS_SCRIPT_URL est vide
  // (mode démo). En mode connecté, le mot de passe réel vit dans l'onglet
  // "Config" de ta Google Sheet.
  MOT_DE_PASSE_DEMO: "tresor2026",
  // Jour et heure du prochain défi hebdomadaire, pour le compte à rebours
  // affiché sur la page d'accueil (0 = dimanche ... 5 = vendredi).
  JOUR_DEFI: 5,
  HEURE_DEFI: 19,
};
