Ce dossier est prévu pour ton visuel officiel de NexiBot.

Le site utilise pour l'instant une mascotte NexiBot dessinée directement en
code (SVG) dans js/nexibot.js — aucune image externe n'est requise, tout
fonctionne tel quel.

Si tu veux utiliser ton vrai visuel NexiBot (celui de tes documents de
présentation) :

1. Exporte-le en PNG avec fond transparent, idéalement carré (ex. 300x300px),
   et nomme-le nexibot.png.
2. Dépose ce fichier dans ce dossier (img/nexibot.png).
3. Dans js/nexibot.js, remplace la fonction nexibotHTML() pour utiliser
   une balise <img src="img/nexibot.png" ...> à la place du SVG — je peux
   faire cette modification pour toi si tu m'envoies le visuel.
