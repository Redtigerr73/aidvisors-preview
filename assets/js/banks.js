// Banques de répliques du simulateur (français). Emplacements remplis par simulator.js :
// {sujet} la question résumée · {angle} l'angle du siège · {nom} son nom · {@role} le nom du siège de ce rôle.
export const FRAMING = [
  'La question posée au conseil : « {sujet} ». Chacun donne son avis, puis {@devil} attaque le consensus. Ordre de passage : {ordre}.',
  'Séance ouverte. Nous décidons : « {sujet} ». Une minute par siège, pas de politesse inutile. Ordre : {ordre}.',
  'Reformulons : « {sujet} ». On cherche ce qui fait échouer cette décision, pas ce qui rassure. Parole à : {ordre}.',
  'Le fondateur nous demande : « {sujet} ». Je rappelle la règle : chacun vote, la conclusion se valide point par point. Ordre : {ordre}.',
  'Sujet du jour : « {sujet} ». Trois questions guideront le débat : pourquoi maintenant, combien ça coûte, comment ça rate. Ordre : {ordre}.',
  'Nous sommes réunis pour « {sujet} ». Avis d’abord, contradiction ensuite, décision enfin. Ordre : {ordre}.',
];

export const OPINIONS = {
  capital: [
    'Sur « {sujet} », je regarde une seule chose : est-ce que dans dix ans ce choix rapporte encore sans effort ? Pour l’instant je vois un pari, pas une douve.',
    'Je n’investis que dans ce que je comprends. « {sujet} » se comprend, mais rien ne protège la marge si un concurrent copie demain.',
    'Ce qui m’intéresse ici, c’est la récurrence. Si « {sujet} » crée un revenu qui revient chaque mois, je suis preneur ; sinon c’est du bruit.',
    'Vingt grandes décisions dans une vie, pas plus. Est-ce que « {sujet} » mérite d’en être une ? Je n’en suis pas encore convaincu.',
    'Le prix qu’on paie, c’est ce qu’on donne ; la valeur, c’est ce qu’on reçoit. Sur « {sujet} », la valeur reste à démontrer.',
    'Je préfère une affaire excellente à un prix correct qu’une affaire correcte à un prix excellent. « {sujet} » doit d’abord prouver qu’elle est excellente.',
  ],
  product: [
    'Trop de choses à la fois. Pour « {sujet} », je garde une seule promesse et je coupe tout le reste.',
    'La vraie question n’est pas technique : qu’est-ce que la personne ressent dans les trente premières secondes ? Sur « {sujet} », personne ne l’a dit.',
    'Dire non est plus difficile que dire oui. Avant « {sujet} », dites-moi les trois choses auxquelles vous renoncez.',
    'Si je dois expliquer « {sujet} » en plus d’une phrase, c’est raté. Simplifiez jusqu’à ce que ça devienne évident.',
    'Les gens ne savent pas ce qu’ils veulent tant qu’on ne le leur a pas montré. Montrez « {sujet} » avant d’en débattre.',
    'Je veux de la qualité là où personne ne regarde. Sur « {sujet} », les détails décideront.',
  ],
  mental: [
    'Inversons : comment « {sujet} » échoue-t-il à coup sûr ? Commencez par là, le reste suivra.',
    'Montrez-moi l’incitation et je vous montrerai le résultat. Qui gagne quoi si « {sujet} » se fait ?',
    'Je vois au moins trois biais ici : excès de confiance, coût irrécupérable, et l’envie d’agir pour agir. « {sujet} » doit y survivre.',
    'Le fondateur aime déjà l’idée. C’est précisément le moment de la tester contre son pire scénario.',
    'Un marteau voit des clous partout. « {sujet} » est-il la bonne solution, ou juste celle qu’on sait faire ?',
    'Évitez la stupidité plutôt que de chercher le génie. Qu’est-ce qui serait stupide dans « {sujet} » ?',
  ],
  startup: [
    'Qui a ce problème aujourd’hui, nommément ? Sur « {sujet} », j’ai besoin de dix noms, pas d’un marché.',
    'Faites des choses qui ne passent pas à l’échelle. Pour « {sujet} », testez à la main cette semaine.',
    'Parlez aux utilisateurs. Combien de personnes ont réellement réclamé « {sujet} » ?',
    'Mieux vaut cent personnes qui adorent que dix mille qui aiment bien. « {sujet} » vise-t-il les cent ?',
    'Le meilleur indicateur, c’est quelqu’un qui paie avant que ce soit prêt. Qui paierait pour « {sujet} » dès lundi ?',
    'Lancez tôt, honteusement tôt. « {sujet} » peut se tester en sept jours, pas en sept mois.',
  ],
  marketing: [
    'Qui est le plus petit public qui adorerait « {sujet} » ? Parlez-lui, à lui seul.',
    'Personne ne partage une offre tiède. Qu’est-ce qui rend « {sujet} » remarquable, au sens propre ?',
    'Le canal avant le message : par où passent les cent premiers clients de « {sujet} » ?',
    'Une offre irrésistible fait sentir bête celui qui la refuse. « {sujet} » n’en est pas encore là.',
    'Le coût d’acquisition doit rester sous trois mois de revenu. Sur « {sujet} », personne ne l’a chiffré.',
    'En Belgique, le message existe en deux langues ou il n’existe pas. « {sujet} » parle-t-il aussi néerlandais ?',
  ],
  finance: [
    'Les chiffres d’abord. Sur « {sujet} », quel est le coût variable et quelle marge reste-t-il ?',
    'Je veux voir douze mois de trésorerie. « {sujet} » tient-il si les revenus arrivent deux fois plus tard ?',
    'Le seuil de rentabilité n’est écrit nulle part. Pour « {sujet} », c’est la première ligne à remplir.',
    'Une marge brute sous 70 % ne finance rien. « {sujet} » doit y arriver ou changer de prix.',
    'Je vois des coûts fixes cachés : temps du fondateur, comptable, assurance. Mettez-les dans « {sujet} ».',
    'Rentable sur le papier, oui. Mais combien de clients faut-il pour couvrir « {sujet} » ? Donnez-moi le nombre.',
  ],
  legal: [
    'Avant tout : quelles obligations belges touchent « {sujet} » ? TVA, RGPD, contrats, et Peppol si c’est du B2B.',
    'Je ne suis pas votre avocate, mais « {sujet} » mérite une relecture professionnelle avant le premier euro.',
    'Les données personnelles changent tout. « {sujet} » en traite-t-il, et sur quelle base légale ?',
    'Un contrat clair vaut mieux qu’un bon procès. Pour « {sujet} », écrivez les conditions avant de vendre.',
    'L’AI Act impose de dire quand on parle à une IA. Si « {sujet} » en utilise, mentionnez-le partout.',
    'La TVA ne pardonne pas l’approximation. Sur « {sujet} », qui facture quoi, et à quel taux ?',
  ],
  security: [
    'Je pense comme l’attaquant : sur « {sujet} », quelle est la donnée la plus précieuse, et qui peut la voler ?',
    'Un secret dans un dépôt, c’est un secret publié. « {sujet} » manipule-t-il des clés ou des mots de passe ?',
    'La plupart des fuites viennent d’un compte sans double authentification. Activez-la avant « {sujet} ».',
    'Moins de surface, moins de risque. « {sujet} » peut-il se faire avec moins d’outils connectés ?',
    'Je veux savoir qui a accès à quoi. Pour « {sujet} », écrivez la liste, elle sera plus courte que prévu.',
    'Une sauvegarde qu’on n’a jamais restaurée n’existe pas. « {sujet} » survit-il à une perte totale ?',
  ],
  ops: [
    'Qu’est-ce qui me réveille à 3 h si « {sujet} » tourne mal ? Il faut une réponse avant de lancer.',
    'Chaque action manuelle par semaine se paie en fatigue. Combien « {sujet} » en ajoute-t-il ?',
    'Si le fondateur part trois semaines, « {sujet} » continue-t-il seul ? Sinon ce n’est pas prêt.',
    'Je veux une alerte quand ça casse, et un mode dégradé quand le fournisseur tombe. « {sujet} » n’a ni l’un ni l’autre.',
    'Le jour du lancement, tout marche. C’est le trentième jour qui compte pour « {sujet} ».',
    'Écrivez la procédure de retour en arrière de « {sujet} ». Si elle tient en cinq lignes, on peut y aller.',
  ],
  customer: [
    'Moi, cliente, je me demande : pourquoi changer ce que je fais déjà ? « {sujet} » doit me faire gagner du temps tout de suite.',
    'Je n’ai pas lu la page jusqu’au bout. En une phrase, qu’est-ce que « {sujet} » change pour moi ?',
    'Le prix, je le compare à ce que je paie déjà. « {sujet} » est-il moins cher ou vraiment meilleur ?',
    'Si je dois créer un compte et attendre, je pars. « {sujet} » doit marcher en cinq minutes.',
    'Je parle néerlandais avec la moitié de mes fournisseurs. « {sujet} » marche-t-il pour eux aussi ?',
    'Je fais confiance à mon comptable, pas à un inconnu. Qu’est-ce qui me rassure dans « {sujet} » ?',
  ],
  free: [
    'Sous l’angle {angle}, « {sujet} » tient si la contrainte principale est réglée d’abord.',
    'Je regarde « {sujet} » avec mon angle, {angle} : c’est là que personne n’a encore creusé.',
    'Du point de vue {angle}, « {sujet} » comporte un risque que le conseil sous-estime.',
    'Mon métier, c’est {angle}. Pour « {sujet} », la première question est concrète : qui s’en occupe lundi ?',
    'Côté {angle}, « {sujet} » est faisable, à condition d’y mettre un responsable et une date.',
    'Avec mon angle ({angle}), je vois une économie possible dans « {sujet} », mais aussi un piège.',
  ],
};

export const OBJECTIONS = {
  capital: [['critique', 'Aucun avantage durable : un concurrent copie en six semaines.'], ['forte', 'Le revenu n’est pas récurrent, il faut le reconquérir chaque mois.'],
    ['forte', 'Le capital immobilisé rapporte moins qu’un placement simple sur la même durée.'], ['mineure', 'Trop de paris en même temps dilue l’attention.'],
    ['critique', 'La décision est irréversible alors que l’information manque encore.'], ['mineure', 'Le rendement attendu n’est pas chiffré.']],
  product: [['critique', 'Plus de trois fonctions au départ : personne ne saura dire ce que c’est.'], ['forte', 'Le premier contact n’a pas été testé avec un vrai utilisateur.'],
    ['forte', 'L’offre ressemble à celle des concurrents, rien ne la rend évidente.'], ['mineure', 'Le nom ne dit pas ce que fait le produit.'],
    ['mineure', 'Trop d’options dans les réglages.'], ['critique', 'Aucun « non » assumé : tout le monde est la cible.']],
  mental: [['critique', 'Biais de confirmation : seules les preuves favorables ont été cherchées.'], ['forte', 'Les incitations de l’acheteur et de l’utilisateur divergent.'],
    ['forte', 'Coût irrécupérable : on continue parce qu’on a déjà investi.'], ['mineure', 'Analogie boiteuse avec un succès célèbre.'],
    ['critique', 'Le pire scénario n’a jamais été écrit.'], ['mineure', 'Complexité inutile dans le montage.']],
  startup: [['critique', 'Personne n’a encore payé ni promis de payer.'], ['forte', 'Le problème vient du fondateur, pas des utilisateurs.'],
    ['forte', 'Aucun test possible en moins de deux semaines.'], ['mineure', 'Le segment visé est trop large pour être servi correctement.'],
    ['critique', 'Les dix premiers clients ne sont pas nommés.'], ['mineure', 'On construit avant de parler aux gens.']],
  marketing: [['critique', 'Pas de canal identifié pour les cent premiers clients.'], ['forte', 'Le coût d’acquisition dépasse probablement trois mois de revenu.'],
    ['forte', 'Le message n’existe qu’en français.'], ['mineure', 'Rien dans l’offre ne donne envie d’en parler.'],
    ['mineure', 'Aucune preuve sociale à montrer.'], ['critique', 'La cible n’a pas de communauté où la toucher.']],
  finance: [['critique', 'La marge brute reste sous 70 % une fois les coûts variables comptés.'], ['forte', 'Moins de six mois de trésorerie en cas de retard.'],
    ['forte', 'Le seuil de rentabilité n’est pas calculé.'], ['mineure', 'Les frais bancaires et de paiement sont oubliés.'],
    ['critique', 'Le temps du fondateur n’est pas valorisé.'], ['mineure', 'Pas de scénario pessimiste.']],
  legal: [['critique', 'Le régime de TVA n’est pas clarifié.'], ['forte', 'Des données personnelles sans registre ni base légale (RGPD).'],
    ['forte', 'Aucune condition générale de vente écrite.'], ['mineure', 'La facturation B2B doit passer par Peppol.'],
    ['critique', 'Responsabilité non plafonnée vis-à-vis des clients.'], ['mineure', 'Les mentions légales du site sont incomplètes.']],
  security: [['critique', 'Des secrets risquent de finir dans le code ou un tableur partagé.'], ['forte', 'Comptes sans double authentification.'],
    ['forte', 'Sauvegardes jamais restaurées.'], ['mineure', 'Trop d’outils tiers connectés.'],
    ['critique', 'Les données clients sont accessibles à trop de monde.'], ['mineure', 'Pas de procédure en cas de fuite.']],
  ops: [['critique', 'Aucune alerte ni mode dégradé si un fournisseur tombe.'], ['forte', 'Plus de deux heures d’actions manuelles par semaine.'],
    ['forte', 'Tout repose sur une seule personne.'], ['mineure', 'Pas de procédure de retour en arrière écrite.'],
    ['mineure', 'Aucun suivi du coût par client.'], ['critique', 'Le jour 30 n’a pas été pensé, seulement le lancement.']],
  customer: [['critique', 'Je ne vois pas pourquoi changer ce que j’utilise déjà.'], ['forte', 'Trop long avant de voir un résultat.'],
    ['forte', 'Le prix se compare mal à mes outils actuels.'], ['mineure', 'Rien en néerlandais pour mes partenaires.'],
    ['mineure', 'Je ne sais pas qui est derrière.'], ['critique', 'Je ne confie pas mes chiffres à un inconnu.']],
  free: [['forte', 'Contrainte {angle} non traitée.'], ['mineure', 'Personne n’est responsable de l’aspect {angle}.'],
    ['forte', 'Le coût lié à {angle} n’est pas chiffré.'], ['critique', 'Un risque {angle} pourrait tout bloquer.'],
    ['mineure', 'Pas de calendrier pour {angle}.'], ['forte', 'Les fournisseurs côté {angle} ne sont pas identifiés.']],
};

export const EVIDENCE = {
  capital: ['Trois ans de chiffres d’un acteur comparable.', 'La part de revenu récurrent sur 12 mois.', 'Le rendement attendu face à un ETF mondial.'],
  product: ['Une démo montrée à 5 utilisateurs, chronométrée.', 'La liste des fonctions retirées.', 'Une phrase qui explique tout, testée sur 10 personnes.'],
  mental: ['Le pré-mortem écrit : comment ça échoue.', 'La carte des incitations de chaque acteur.', 'Un avis extérieur qui n’a aucun intérêt dans l’affaire.'],
  startup: ['Dix noms de personnes qui ont ce problème.', 'Trois préventes encaissées.', 'Un test réalisé en moins de 14 jours.'],
  marketing: ['Le coût d’un lead sur 100 € de publicité test.', '6 posts FR/NL et leurs résultats.', 'Une communauté nommée où se trouve la cible.'],
  finance: ['Un tableau de trésorerie sur 12 mois.', 'Le coût variable par client mesuré.', 'Le nombre de clients au seuil de rentabilité.'],
  legal: ['L’avis écrit d’un comptable ou d’un avocat.', 'Le registre des traitements RGPD.', 'Les CGV relues.'],
  security: ['La liste des accès et des secrets.', 'Un test de restauration réussi.', 'La double authentification activée partout.'],
  ops: ['Le nombre d’actions manuelles par semaine.', 'Une alerte testée.', 'La procédure de retour en arrière.'],
  customer: ['Cinq clients qui l’utilisent sans aide.', 'Le temps avant le premier résultat.', 'Une comparaison de prix honnête.'],
  free: ['Un devis ou un avis de spécialiste ({angle}).', 'Un responsable nommé pour {angle}.', 'Un calendrier daté pour {angle}.'],
};

// Pondération des votes [GO, GO_SOUS_CONDITION, NO_GO] par rôle.
export const VOTE_WEIGHTS = {
  capital: [1, 5, 3], product: [2, 5, 2], mental: [1, 5, 3], startup: [3, 5, 2], marketing: [3, 5, 1],
  finance: [1, 5, 3], legal: [1, 6, 2], security: [1, 6, 2], ops: [1, 6, 2], customer: [2, 4, 3], free: [2, 5, 2],
};

export const DEVIL = [
  '{consensus} Voilà exactement le problème : tout le monde est d’accord et personne n’a de preuve. {@capital} parle de douve, {@finance} de marge, mais sur « {sujet} » aucun chiffre réel n’a été posé sur la table.',
  'Je vais être désagréable. {consensus} Ce confort est suspect. Et si « {sujet} » ne répondait à aucune demande réelle ? {@startup} l’a effleuré sans aller au bout.',
  '{consensus} Un conseil unanime, c’est un conseil qui ne sert à rien. Sur « {sujet} », je défends l’option inverse, et je vous mets au défi de la réfuter.',
  'Arrêtons de nous rassurer. {consensus} Le vrai risque de « {sujet} », c’est le temps qu’il vole à tout le reste. {@product} devrait le dire plus fort.',
  '{consensus} Vous votez sous condition pour ne pas avoir à dire non. Sur « {sujet} », une condition sans date ni chiffre, c’est un oui déguisé.',
  'Je contredis. {consensus} Personne n’a regardé ce que fait un concurrent avec dix fois nos moyens. « {sujet} » survit-il à sa réaction ?',
];

export const REBUTTAL = {
  oppose: [
    '{diable} exagère : on a des signaux, même faibles. Je maintiens mon vote, à condition de les mesurer en 14 jours.',
    'Je ne suis pas d’accord avec {diable}. Le risque existe, mais ne rien faire coûte aussi. Je garde ma position.',
    'C’est facile de tout contester, {diable}. Proposez un test, je le signe.',
    '{diable} confond prudence et immobilisme. Sur ce point précis, je reste où je suis.',
  ],
  agree: [
    '{diable} touche juste. Je change mon vote : sans preuve chiffrée, je ne peux pas soutenir ça tel quel.',
    'J’avoue, {diable} a raison sur un point : on n’a pas de date. Je durcis ma condition.',
    'L’objection de {diable} me fait bouger. Je révise mon vote.',
    'Je me range à l’avis de {diable} : on se rassurait trop vite.',
  ],
};

export const SYNTHESIS = [
  '{f} sièges favorables sur {v}, seuil {n}. Le conseil rend : {outcome}. Les objections ouvertes et les expériences sont listées pour validation.',
  'Fin des débats. Décompte : {f} sur {v} (seuil {n}). Décision du conseil : {outcome}. À toi de valider chaque point.',
  'Je résume : {f} favorables, {v} votants, seuil {n}. Décision : {outcome}. Les trois expériences permettront de trancher les désaccords.',
];

export const INTERJECTION = {
  reply: [
    'Bonne question. Sur « {remarque} », ma réponse reste cohérente avec mon angle : {angle}. Il faut le vérifier avant d’aller plus loin.',
    'Tu me demandes « {remarque} ». Franchement : ça dépend d’un chiffre que personne n’a encore. Trouve-le et je te réponds net.',
    'Sur « {remarque} », je nuance ce que j’ai dit : c’est un risque réel, mais gérable si quelqu’un en prend la responsabilité.',
    '« {remarque} » ? Je le prends au sérieux. Je propose qu’on en fasse une condition explicite de la décision.',
  ],
  react: [
    'J’ajoute un mot à ce qui vient d’être dit : c’est plus urgent que ça en a l’air.',
    'Je ne suis pas tout à fait d’accord avec cette réponse. Il manque l’angle du coût.',
    'D’accord avec ça. Et ça rejoint mon objection de tout à l’heure.',
    'Attention : cette réponse suppose que tout se passe bien. Prévoyons l’inverse.',
  ],
};

export const DIG = {
  author: [
    'Je reprends mon objection : « {objection} ». Concrètement, voici ce qui la lèverait : un test de deux semaines avec un critère chiffré.',
    'Je précise « {objection} » : ce n’est pas un détail, c’est ce qui décidera du résultat.',
    'Sur « {objection} », je veux bien assouplir si on obtient une preuve écrite avant de dépenser.',
  ],
  devil: [
    'Creusons vraiment : « {objection} » n’est que la partie visible. Le problème de fond est qu’on avance sans preuve.',
    'Si on creuse « {objection} », on découvre que personne n’en est responsable. C’est ça le vrai risque.',
    'Je pousse « {objection} » plus loin : et si c’était rédhibitoire ?',
  ],
  ally: [
    'Je rejoins l’objection « {objection} », et je change mon vote en conséquence.',
    'Vu sous mon angle, « {objection} » se règle facilement : il suffit de nommer quelqu’un et une date.',
    'D’accord pour creuser « {objection} », mais sans bloquer le reste de la décision.',
  ],
};

export const EXPERIMENTS = {
  pricing: ['Proposer le nouveau prix à 20 clients ou prospects : succès si au moins 12 l’acceptent sans négocier.',
    'Page de prix avec deux offres pendant 14 jours : succès si au moins 5 % des visiteurs choisissent la plus chère.'],
  launch: ['Page d’accueil et 50 € de publicité locale pendant 14 jours : succès si au moins 30 inscriptions.',
    'Ouverture test un samedi : succès si au moins 40 visiteurs et 10 achats.'],
  invest: ['Simuler 12 mois de versements sur l’historique : succès si la pire baisse reste sous 25 %.',
    'Placer un premier montant test de 100 € : succès si les frais réels restent sous 0,5 %.'],
  legal: ['Faire relire le montage par un comptable ou un avocat : succès si 0 point bloquant.',
    'Rédiger les CGV et le registre RGPD en 7 jours : succès si validés par un professionnel.'],
  marketing: ['6 posts LinkedIn (3 FR, 3 NL) : succès si au moins 10 contacts qualifiés, dont 3 en néerlandais.',
    '100 € de publicité ciblée : succès si le coût par contact reste sous 10 €.'],
  tech: ['Prototype cliquable montré à 5 utilisateurs : succès si 4 sur 5 finissent la tâche sans aide.',
    'Mesurer le temps jusqu’au premier résultat : succès si sous 5 minutes pour 8 testeurs sur 10.'],
  team: ['Écrire à deux une convention d’associés type : succès si accord écrit sur 5 points clés en 14 jours.'],
  finance: ['Tableau de trésorerie sur 12 mois : succès si jamais sous 3 mois de charges.',
    'Mesurer le coût variable réel sur 10 ventes : succès si la marge brute dépasse 70 %.'],
  generic: ['Parler à 10 personnes concernées : succès si 3 acceptent un engagement payé.',
    'Préventes pendant 14 jours : succès si au moins 3 paiements reçus d’inconnus.',
    'Pré-mortem écrit en 1 heure : succès si chaque risque majeur a un responsable et une date.'],
};

export const TOPIC_WORDS = {
  pricing: ['prix', 'tarif', 'abonnement', '€', 'euros', 'prijs', 'tarief', 'price', 'pricing', 'subscription', 'cher', 'duur'],
  launch: ['lancer', 'ouvrir', 'lancement', 'creer', 'demarrer', 'boutique', 'starten', 'openen', 'lanceren', 'launch', 'open', 'start', 'shop'],
  invest: ['investir', 'placer', 'placement', 'etf', 'epargne', 'action', 'actions', 'bourse', 'beleggen', 'investeren', 'sparen', 'invest', 'savings', 'stock', 'crypto'],
  legal: ['tva', 'rgpd', 'contrat', 'juridique', 'loi', 'peppol', 'btw', 'gdpr', 'wet', 'contract', 'legal', 'vat', 'law'],
  marketing: ['client', 'clients', 'marketing', 'publicite', 'linkedin', 'vente', 'ventes', 'klant', 'klanten', 'reclame', 'verkoop', 'customer', 'customers', 'ads', 'sales'],
  tech: ['logiciel', 'app', 'application', 'saas', 'ia', 'site', 'software', 'ai', 'website', 'tech', 'platform', 'plateforme'],
  team: ['associe', 'associes', 'equipe', 'partenaire', 'team', 'vennoot', 'partner', 'cofondateur'],
  finance: ['pret', 'credit', 'tresorerie', 'marge', 'rentable', 'lening', 'krediet', 'loan', 'cash', 'margin', 'profit', 'budget'],
};

export const OUTCOME_LABEL = { GO: 'GO', GO_SOUS_CONDITION: 'GO sous condition', RETRAVAILLER: 'à retravailler', NO_GO: 'NO GO' };

export const DEVIL_OBJECTIONS = [['critique', 'Le consensus repose sur une hypothèse que personne n’a prouvée.'],
  ['forte', 'Les conditions posées n’ont ni date ni chiffre : ce sont des oui déguisés.'],
  ['forte', 'L’option inverse n’a même pas été étudiée.'], ['critique', 'Le coût d’opportunité est ignoré : ce projet vole du temps au reste.']];

export const FALLBACK_NAMES = { moderator: 'le président', capital: 'le siège Capital', product: 'le siège Produit', mental: 'le siège Modèles mentaux',
  startup: 'le siège Startup', marketing: 'le siège Marketing', finance: 'le siège Finance', legal: 'le siège Juridique',
  security: 'le siège Sécurité', ops: 'le siège Exploitation', customer: 'le siège Client', devil: 'l’avocat du diable', free: 'un siège' };
