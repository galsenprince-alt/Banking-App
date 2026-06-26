# MSF Banking — Rapport de tests

## Résumé
- Tests unitaires : 44/44 passés
- Tests de composants : 24/24 passés
- Tests de validation : 11/11 passés
- Tests E2E : configurés (nécessitent un serveur local pour exécution)

## Corrections apportées
| Fichier | Problème | Correction |
|---------|----------|------------|
| `tests/unit/actions.test.ts` | Vitest v4 rejette `mockReturnValue` sur les classes instanciées avec `new` | Remplacé les mocks `vi.fn().mockReturnValue(...)` par des classes `class MockClient { ... }` avec `mockImplementation` |

## Problèmes restants (si applicable)
| Problème | Détail |
|----------|--------|
| Dwolla references résiduelles | `dwolla-v2` reste dans `package.json` comme dépendance, `lib/actions/dwolla.actions.ts` existe comme bridge Dwolla→Stripe, `types/index.d.ts` contient des commentaires Dwolla |
| Absence de middleware auth | Aucun `middleware.ts` pour protéger les routes — les pages renvoient `null` quand non connecté au lieu de rediriger |
| `console.log` dans stripe.actions.ts | Ligne 53 utilise `console.log` pour afficher un ID de compte bancaire en production |

## Commandes
- `npm test` — tests unitaires + composants
- `npx playwright test` — tests E2E
- `npm run test:coverage` — rapport de couverture
