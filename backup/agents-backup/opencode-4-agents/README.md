# Pipeline 4 agents — Builder / Predictor / Reviewer / Explorer

## Installation

1. Copie le dossier `.opencode/agents/` à la racine de ton projet (ou dans `~/.config/opencode/agents/` si tu veux que ce pipeline soit disponible sur tous tes projets).
2. Vérifie que ta structure ressemble à ça :

```
ton-projet/
└── .opencode/
    └── agents/
        ├── builder.md
        ├── predictor.md
        ├── reviewer.md
        ├── explorer.md
        └── orchestrateur.md
```

3. Lance OpenCode dans ton projet, puis passe sur l'agent principal :

```
opencode --agent orchestrateur
```

ou, en cours de session, tape `Tab` jusqu'à tomber sur `orchestrateur`, ou mentionne-le avec `@orchestrateur`.

4. Écris ta demande normalement. L'orchestrateur va automatiquement :
   - Faire travailler `builder` en premier.
   - Lancer `reviewer` et `predictor` en parallèle sur le résultat du Builder.
   - Envoyer les 3 résultats à `explorer` pour arbitrage final.
   - Te livrer une synthèse claire, sans que tu aies besoin de copier-coller quoi que ce soit entre les agents.

## Modèle "LLM Free"

Chaque fichier `.md` n'a **pas** de champ `model` défini : les sous-agents héritent automatiquement du modèle configuré sur l'agent principal (`orchestrateur`) — donc un seul réglage suffit.

Pour fixer ton modèle gratuit, ajoute-le soit :

- Globalement dans `opencode.json` :
```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "TON_PROVIDER/TON_MODELE_GRATUIT"
}
```

- Ou directement dans `orchestrateur.md`, en ajoutant une ligne dans le frontmatter :
```yaml
model: TON_PROVIDER/TON_MODELE_GRATUIT
```

Remplace `TON_PROVIDER/TON_MODELE_GRATUIT` par l'identifiant exact du modèle gratuit que tu utilises (visible via `opencode models` dans ton terminal).

## Si tu veux forcer un modèle différent par agent

Rien ne t'empêche de donner un modèle plus "raisonneur" au Predictor et au Reviewer (analyse fine) et un modèle plus rapide au Builder (génération) — ajoute simplement `model: ...` dans le frontmatter du fichier concerné. C'est le seul endroit à toucher, tout le reste du pipeline s'adapte automatiquement.

## Ajuster les permissions

Si tu veux que le Builder modifie directement les fichiers sans confirmation, passe `bash: ask` à `bash: allow` dans `builder.md`. À l'inverse, si tu veux garder un contrôle humain sur chaque écriture de fichier, mets `edit: ask` partout où c'est à `allow`.
