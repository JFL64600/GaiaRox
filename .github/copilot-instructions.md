<!-- EF Copilot runtime: start -->
## Execution Framework (EF)

EF is initialized in this project. At the start of every session, load context by reading:
- `.ef/PROJECT.md` — what we are building and project constraints
- `.ef/tracks/<username>/STATE.md` — current phase, day, and progress
- `.ef/tracks/<username>/CHECKPOINT.md` — what happened last session and what's next

Resolve `<username>` via `git config user.name`.

### Quick command reference
| Phase | Commands |
|---|---|
| Setup | `ef:init`, `ef:map`, `ef:skills` |
| Planning | `ef:draft`, `ef:discuss`, `ef:assumptions`, `ef:plan` |
| Execution | `ef:dev <day>`, `ef:dev --wave`, `ef:quick <task>` |
| Verification | `ef:verify`, `ef:test`, `ef:review` |
| Session | `ef:resume`, `ef:status`, `ef:diff` |
| Wrap-up | `ef:pr`, `ef:done` |

Use `/fleet` for parallel wave execution (`ef:dev --wave`).
<!-- EF Copilot runtime: end -->
