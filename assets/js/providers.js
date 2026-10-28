// Mode réel (étape 2, pas dans ce POC). Contrat d'un fournisseur, sans aucune implémentation réseau ici.
//
//   interface Provider {
//     id: string; label: string;
//     complete(messages: { role: 'system'|'user'|'assistant', content: string }[],
//              opts: { model?: string, maxTokens?: number, signal?: AbortSignal },
//              onToken: (text: string) => void): Promise<string>;
//   }
//
// Règles déjà décidées (verdict du conseil, 28/10/2026) :
// - jamais servi depuis *.github.io : l'origine et son stockage sont partagés par tous les sites Pages du compte ;
// - clé chiffrée (WebCrypto AES-GCM, PBKDF2) sur une origine dédiée, ou mieux conservée côté serveur UE ;
// - données réelles : jamais vers des modèles gratuits qui journalisent ou entraînent sur les requêtes.
export const PROVIDERS = [
  { id: 'openrouter', label: 'OpenRouter (modèles gratuits)', status: 'soon' },
  { id: 'gemini', label: 'Google Gemini (niveau gratuit)', status: 'soon' },
  { id: 'anthropic', label: 'Anthropic Claude', status: 'soon' },
];

/** Aucun fournisseur actif dans le POC : le simulateur répond seul. */
export function activeProvider() {
  return null;
}
