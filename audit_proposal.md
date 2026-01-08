# Audit & Refactoring Proposal: Inmueble Advisor

> **Date:** 2026-01-07
> **Scope:** Project Wide (Frontend + Backend)
> **Goal:** Architecture Compliance, Cleanup, and Agentic Optimization.

## 1. Compliance Analysis (`MANUALDEARQUITECTURA.md`)

Our analysis compared the current implementation against the authorized architecture manual.

| Principle | Status | Discrepancy / Observation |
| :--- | :---: | :--- |
| **Microservices / SRP** | ⚠️ **Partial** | The Frontend (`src`) contains significant business logic (e.g., `LeadAssignmentService`) that duplicates or overlaps with Cloud Functions (`onLeadCreated`). The Frontend is "Thick" rather than a "Thin Client". |
| **Folder Structure** | ⚠️ **Violation** | `src/types` contains Domain Models (Entities) with business logic (`mapModelo`, `procesarImagenes`). Manual requires these in `/src/models`. |
| **Internal Libraries** | ❌ **Missing** | There is no shared library mechanism. `functions` and `src` have code duplication (e.g., User/Lead repositories are implemented twice). |
| **Dependency Injection** | ✅ **Passed** | The `useService()` hook + `ServiceContext` correctly implements DI for React components. `serviceProvider.js` acts as the Composition Root (though marked deprecated, it is functionally required). |
| **Database Isolation** | ⚠️ **Warning** | Frontend accesses Firestore directly via `src/repositories`. While efficient, it bypasses the "Service API" rule for Write operations in several places. |

## 2. Code Hygiene Audit

### A. Dead / Obsolete Code
*   **`src/services/serviceProvider.js`**: Marked as `deprecated` but is CRITICAL for `ServiceContext`.
    *   *Action*: Remove "Legacy" warning, rename to `ServiceFactory.js` or `CompositionRoot.js`, and strict cleanup of unused imports.
*   **`data-manager/`**: A useful CLI tool, not dead code.
*   **`scripts/`**: `convert-docs.mjs` is a utility script. Safe to keep as Tooling.
*   **`src/screens/*.jsx`**: Most screens seem active. `test_Favoritos.jsx` should be moved to `tests/` or deleted.

### B. Logical Duplication (DRY Violation)
*   **Lead Assignment**:
    *   Frontend: `LeadAssignmentService.js` (Calculates Commission, Assigns Developer).
    *   Backend: `onLeadCreated.ts` (Sends Notifications).
    *   *Risk*: Security hole. Use of `MANUAL_B2B_PROCESS` in frontend implies logic that should be trusted backend code.
    *   *Recommendation*: Move Commission Calculation to a Callable Cloud Function `createLead`.
*   **Models**: `src/types/Modelo.js` (Frontend) vs `functions/src/core/entities` (implied). Need a "Shared Kernel".

## 3. Agentic Friendliness Improvements

To help future Agents (Gemini/Antigravity) navigate and code faster:

1.  **Explict Typing/JSDoc**: The Backend uses TypeScript (Good), but Frontend is loose JS.
    *   *Plan*: Add JSDoc to all Service methods in `src/services` to enforce "Contract".
2.  **`jsconfig.json`**: Missing in root.
    *   *Plan*: Create `jsconfig.json` defining paths `@services/*`, `@models/*` to help agents resolve imports without guessing relative paths.
3.  **Map of Architecture**:
    *   *Plan*: Create `DOCUMENTATION/CODE_MAP.md` linking User Flows -> Frontend Components -> Services -> Backend Triggers.

## 4. Execution Plan (Proposed)

We propose executing the following changes in order:

### Phase 1: Structural Compliance (Quick Wins)
1.  **Move** `src/types/*.js` to `src/models/` and update imports.
2.  **Rename** `src/types` (if empty) or keep for pure typescript defs.
3.  **Create** `jsconfig.json` at root.
4.  **Refactor** `src/services/serviceProvider.js`: Clean up comments, remove unused generic imports, solidify its role as "App Composition Root".

### Phase 2: Logic Cleanup (Deep Refactor)
1.  **Centralize Types**: Create a structural agreement (or shared file if possible, otherwise keep in sync) for `Lead` and `User` entities.
2.  **Review `LeadAssignmentService`**: Document the "Thick Client" decision as an ADR (Architecture Decision Record) OR plan migration to `functions`. *Recommendation for this Sprint: Document as ADR and keep code for stability.*

### Phase 3: Documentation
1.  **Generate** `ADR-001-ThickClientLeadGeneration.md`.
2.  **Update** `MANUALDEARQUITECTURA.md` to reflect the validated structure.

---
**Ready to apply?**
The user should authorize **Phase 1** to begin immediately.
