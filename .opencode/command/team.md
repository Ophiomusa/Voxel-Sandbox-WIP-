---
description: Lance le pipeline complet Builder -> Reviewer+Predictor -> Explorer sur une demande, avec relayage du doute et métriques qualité.
agent: orchestrateur
---

Exécute le pipeline complet en 4 phases sur la demande suivante, en respectant strictement l'ordre défini dans tes instructions :

1. **Phase 1** : Builder seul — note les scores de confiance et le budget de doute
2. **Phase 2** : Reviewer + Predictor en parallèle — note les signaux de certitude
3. **Phase 3** : Explorer avec contexte complet — verdict tranché
4. **Phase 4** : Synthèse finale avec tableau d'hypothèses et métriques qualité

Demande de l'utilisateur :

$ARGUMENTS
