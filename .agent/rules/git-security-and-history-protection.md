---
trigger: always_on
---

The agent is strictly forbidden from executing destructive terminal commands (rm, rmdir, sudo, curl, wget) and any Git commands that modify repository history (git rebase, git push -f). All commit operations require explicit human approval via the Agent Manager.