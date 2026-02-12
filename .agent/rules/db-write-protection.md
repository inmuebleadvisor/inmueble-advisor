---
description: Enforce strict data governance for any data modification operations (BigQuery, Firestore).
globs: "**/*"
---

# 🛡️ PROTOCOL: DATA MODIFICATION WRITE-LOCK

**TRIGGER:**
This rule IS ACTIVATED AUTOMATICALLY whenever the agent intends to execute a **write/modification operation** on any persistent data store (BigQuery, Firestore, Cloud Storage, etc.).
Specific triggers include intentions to use: `INSERT`, `UPDATE`, `DELETE`, `DROP`, `setDoc`, `updateDoc`, `deleteDoc`, or any equivalent SDK method modifying data.

**IMMEDIATE ACTION:**
1.  🛑 **STOP.** Do NOT call the tool or execute the script immediately.
2.  📝 **GENERATE ARTIFACT.** You MUST create a new file named `DATA_OPERATION_PLAN.md` in the root (or `brain/`) directory.

**ARTIFACT CONTENT (`DATA_OPERATION_PLAN.md`):**
The plan MUST contain the following sections:
-   **QUERY/COMMAND:** The exact SQL query or raw JSON/code you intend to execute.
-   **TARGET:** The specific `Project`, `Dataset`, and `Table` (or `Collection`) being modified.
-   **IMPACT ASSESSMENT:** Estimated number of rows/documents to be affected.
-   **ROLLBACK STRATEGY:** A concrete, executable plan to undo this change if it results in data loss or corruption (e.g., "restore from snapshot X", "run inverse UPDATE").

**EXIT CONDITION:**
*   You are **STRICTLY FORBIDDEN** from proceeding with the tool call until the user reviews `DATA_OPERATION_PLAN.md` and explicitly replies with "**APROBADO**".
*   If the user replies with anything else, you must ABORT the operation.
*   Arguments like `--force`, `auto-approve`, or `-y` are **STRICTLY PROHIBITED** for these operations.

**EXCEPTIONS:**
*   **READ-ONLY** operations (`SELECT`, `getDoc`, `list_tables`, `count`) do **NOT** require this protocol and may proceed normally.
