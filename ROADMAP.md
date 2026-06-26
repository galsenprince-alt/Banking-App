# 🗺️ MSF Banking — Feuille de route & Suivi qualité
> Dernière mise à jour : 2026-06-26
> Généré automatiquement après exécution de la suite de tests

---

## 📊 Tableau de bord — État général

| Catégorie            | Total | ✅ Passés | ❌ Échoués | ⚠️ Ignorés | Couverture |
|----------------------|-------|-----------|------------|------------|------------|
| Tests unitaires      | 55    | 55        | 0          | 0          | N/A        |
| Tests de composants  | 24    | 24        | 0          | 0          | N/A        |
| Tests E2E            | 11    | N/A       | N/A        | N/A        | N/A        |
| **TOTAL**            | **90**| **79**    | **0**      | **0**      | N/A        |

**Score global de santé : 100% ▓▓▓▓▓▓▓▓▓▓** (sur les tests exécutés)

> Note : Les 11 tests E2E sont configurés mais nécessitent un serveur local (`npm run dev`) pour s'exécuter. Le score ne les inclut pas.

---

## 🐛 Bugs trouvés et corrigés

| # | Fichier source | Description du bug | Sévérité | Statut | Correction apportée | Date |
|---|----------------|--------------------|----------|--------|---------------------|------|
| 1 | `tests/unit/actions.test.ts` | Vitest v4 incompatibilité avec `vi.fn().mockReturnValue()` pour les classes `new`-ed | 🟡 Mineur | ✅ Corrigé | Mocks réécrits avec `class MockX {}` au lieu de `vi.fn().mockReturnValue()` | 2026-06-26 |

> **Niveaux de sévérité :**
> - 🔴 Critique — L'app plante ou une donnée est corrompue
> - 🟠 Majeur — Une fonctionnalité clé est inutilisable
> - 🟡 Mineur — Comportement inattendu sans blocage
> - 🔵 Info — Amélioration ou avertissement

---

## 🚧 Nouveaux bugs découverts (non encore corrigés)

| # | Fichier | Description | Sévérité | Priorité | Assigné à | Date découverte |
|---|---------|-------------|----------|----------|-----------|-----------------|
| 1 | `package.json` | `dwolla-v2` reste comme dépendance alors que la migration vers Stripe est terminée | 🟡 Mineur | Basse | Claude Code | 2026-06-26 |
| 2 | `lib/actions/dwolla.actions.ts` | Le fichier bridge Dwolla→Stripe utilise `require("stripe")` au lieu d'un import ES — aucun tree-shaking | 🟡 Mineur | Basse | Claude Code | 2026-06-26 |
| 3 | `lib/actions/stripe.actions.ts:53` | `console.log` en production affiche l'ID de compte bancaire | 🟡 Mineur | Moyenne | Claude Code | 2026-06-26 |
| 4 | `types/index.d.ts:265-269` | `CreateFundingSourceOptions` référence Dwolla (obsolète) | 🔵 Info | Basse | Claude Code | 2026-06-26 |
| 5 | N/A | Aucun `middleware.ts` pour protéger les routes — pages renvoient `null` au lieu de rediriger vers `/sign-in` | 🟠 Majeur | Haute | Claude Code | 2026-06-26 |

---

## ✅ Plan d'action — Prochaines étapes

| Priorité | Tâche | Type | Fichier(s) concerné(s) | Effort estimé | Statut |
|----------|-------|------|------------------------|---------------|--------|
| 🔴 P1 | Ajouter middleware auth pour protéger les routes | Feature | `middleware.ts` | ~30 min | ⏳ À faire |
| 🟠 P2 | Supprimer `console.log` des actions Stripe | Bug fix | `lib/actions/stripe.actions.ts` | ~5 min | ⏳ À faire |
| 🟠 P2 | Supprimer dépendance `dwolla-v2` | Cleanup | `package.json` | ~5 min | ⏳ À faire |
| 🟡 P3 | Nettoyer types Dwolla résiduels | Cleanup | `types/index.d.ts` | ~10 min | ⏳ À faire |
| 🟡 P3 | Refactoriser `dwolla.actions.ts` bridge vers import ES | Refactoring | `lib/actions/dwolla.actions.ts` | ~15 min | ⏳ À faire |
| 🔵 P4 | Ajouter couverture de code avec `@vitest/coverage-v8` | Test | `vitest.config.ts` | ~15 min | ⏳ À faire |
| 🔵 P4 | Configurer CI GitHub Actions pour exécuter les tests | DevOps | `.github/workflows/test.yml` | ~30 min | ⏳ À faire |

---

## 🔐 Audit de sécurité

| Vérification | Statut | Détail |
|---|---|---|
| Aucune clé secrète exposée côté client | ✅ | `APPWRITE_SECRET`, `PLAID_SECRET`, `STRIPE_SECRET_KEY` sont côté serveur uniquement |
| Endpoint Appwrite inclut `/v1` | ✅ | Configuré via env var `NEXT_PUBLIC_APPWRITE_ENDPOINT`, valeur recommandée inclut `/v1` |
| Tokens Plaid non loggés | ✅ | Aucun `console.log` ne contient de tokens Plaid |
| Références Dwolla résiduelles | ⚠️ Trouvées dans `package.json`, `dwolla.actions.ts`, `types/index.d.ts`, `PaymentTransferForm.tsx` |
| Middleware Next.js à jour (CVE) | ⚠️ Aucun middleware auth trouvé — routes non protégées |
| Variables sensibles hors du code source | ✅ | Toutes les clés sensibles sont dans les env vars, `.env*` est dans `.gitignore` |
| `console.log` en production | ⚠️ `stripe.actions.ts:53` affiche un ID de compte bancaire |

---

## 📈 Historique des sessions de tests

| Session | Date | Tests passés | Bugs corrigés | Nouveaux bugs | Score santé |
|---------|------|-------------|---------------|---------------|-------------|
| #1      | 2026-06-26 | 79/79       | 1             | 5             | 100%        |

---

## 📁 Structure des fichiers de test générés

```
tests/
├── setup.ts
├── unit/
│   ├── utils.test.ts
│   ├── validation.test.ts
│   └── actions.test.ts
├── components/
│   ├── AuthForm.test.tsx
│   ├── Dashboard.test.tsx
│   └── PlaidLink.test.tsx
└── e2e/
    ├── auth.spec.ts
    ├── dashboard.spec.ts
    └── navigation.spec.ts
```

---

## 🔄 Comment mettre à jour cette feuille de route

Après chaque session de travail, relance les tests et mets à jour ce fichier :

```bash
npm run test:coverage   # Tests unitaires + composants
npx playwright test     # Tests E2E
# Puis mettre à jour ROADMAP.md manuellement ou demander à Claude Code de le régénérer
```
