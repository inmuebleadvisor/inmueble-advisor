# GEMINI.md - Inmueble Advisor Manifesto

## 🌐 Principles and Protocols

### 🛡️ Principios de Integridad de Datos (Supervisor Mode)

The **"Supervisor Mode"** is active in this environment to prevent accidental data loss or corruption in our primary data stores (BigQuery, Firestore).

1.  **Zero-Trust Write Policy:** No agent is authorized to modify production or staging data without an explicit, pre-approved plan.
2.  **The "Write-Lock" Protocol:** All operations involving `INSERT`, `UPDATE`, `DELETE`, or equivalent mutations are **intercepted** by the `.agent/rules/db-write-protection.md` rule.
3.  **Mandatory Verification:** An artifact `DATA_OPERATION_PLAN.md` MUST be generated and approved by a human Supervisor before execution.
4.  **No Exceptions:** Automated flags like `--force` are banned for data operations.

---
*Verified by AntiGravity Supervisor.*
