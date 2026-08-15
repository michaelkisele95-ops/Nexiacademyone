/* =========================================================================
   NEXIBOT.JS — la mascotte qui accompagne l'enfant à chaque question.
   Injecte un petit robot animé + bulle de dialogue dans n'importe quel
   conteneur. Remplace img/nexibot.svg par ton propre visuel si tu veux
   (voir GUIDE.md, "Personnaliser NexiBot").
   ========================================================================= */

const NEXIBOT_PHRASES = {
  bienvenue: [
    "Prêt(e) pour ton défi de la semaine ?",
    "Je t'accompagne, on y va ensemble !",
    "Chaque question est une nouvelle aventure !",
  ],
  demarrage: [
    "C'est parti, concentre-toi bien !",
    "Lis bien la question, je crois en toi !",
    "À toi de jouer !",
  ],
  bonneReponse: [
    "Excellent ! Tu assures ! 🎉",
    "Bien joué, champion(ne) !",
    "Wahou, en plein dans le mille !",
    "Tu progresses à vue d'œil !",
  ],
  mauvaiseReponse: [
    "Pas grave, on continue !",
    "C'est en se trompant qu'on apprend !",
    "La prochaine est pour toi !",
  ],
  tempsEcoule: [
    "Le temps est passé vite, hein ?",
    "On garde le rythme pour la suite !",
  ],
  fin: [
    "Trésor débloqué, bravo aventurier !",
    "Quelle belle mission, à vendredi prochain !",
    "Ton cerveau vient de faire du sport !",
  ],
  profil: [
    "Regarde comme tu progresses !",
    "Chaque défi te rend plus fort(e) !",
    "Ta courbe raconte une belle histoire !",
  ],
};

function nexibotPhrase(categorie) {
  const liste = NEXIBOT_PHRASES[categorie] || ["..."];
  return liste[Math.floor(Math.random() * liste.length)];
}

/* SVG mascotte simplifiée, dans l'esprit de NexiBot (robot bleu/violet,
   antennes, écran-visage). Remplace-la par ton fichier officiel si tu veux
   (voir img/README.txt). */
const NEXIBOT_SVG = `
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" class="nexibot-svg" aria-hidden="true">
  <defs>
    <linearGradient id="corpsBot" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8b7cf6"/>
      <stop offset="100%" stop-color="#4a6ee0"/>
    </linearGradient>
  </defs>
  <circle cx="30" cy="18" r="5" fill="#f0b429"/>
  <circle cx="90" cy="18" r="5" fill="#f0b429"/>
  <line x1="30" y1="18" x2="40" y2="38" stroke="#f0b429" stroke-width="4"/>
  <line x1="90" y1="18" x2="80" y2="38" stroke="#f0b429" stroke-width="4"/>
  <rect x="18" y="35" width="84" height="62" rx="26" fill="url(#corpsBot)"/>
  <rect x="30" y="48" width="60" height="36" rx="16" fill="#0d1140"/>
  <circle cx="50" cy="66" r="7" fill="#6ee7f5" class="nexibot-oeil"/>
  <circle cx="70" cy="66" r="7" fill="#6ee7f5" class="nexibot-oeil"/>
  <path d="M48 78 Q60 86 72 78" stroke="#6ee7f5" stroke-width="3" fill="none" stroke-linecap="round"/>
  <rect x="8" y="55" width="10" height="24" rx="5" fill="#4a6ee0"/>
  <rect x="102" y="55" width="10" height="24" rx="5" fill="#4a6ee0"/>
</svg>`;

/**
 * Construit le HTML de NexiBot avec une bulle de texte.
 * @param {string} message texte à afficher
 * @param {string} humeur "neutre" | "content" | "encourage"
 */
function nexibotHTML(message, humeur = "neutre") {
  return `
    <div class="nexibot-zone nexibot-${humeur}">
      <div class="nexibot-avatar">${NEXIBOT_SVG}</div>
      <div class="nexibot-bulle">${message}</div>
    </div>
  `;
}

/* ---------- Petits sons dopaminergiques (Web Audio, aucun fichier requis) ---------- */
let nexiAudioCtx = null;
function nexiSon(type) {
  try {
    nexiAudioCtx = nexiAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = nexiAudioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "bonne") {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // Do
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // Mi
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // Sol
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
    } else if (type === "mauvaise") {
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
    } else if (type === "fin") {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.12);
      });
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
    }
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    /* navigateur sans Web Audio : on ignore silencieusement */
  }
}
