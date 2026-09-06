# SAGA-ICM Workspace Instructions

@AGENTS.md

The file above is the canonical instruction set — follow it exactly. Claude Code–specific notes:

- **Skills**: `.claude/skills/` provides `narrative-authenticity` (apply authenticity rules while planning/drafting/reviewing) and `structure-humanize` (diagnose and repair structural AI tells in existing drafts). Use them when their triggers match; their source-of-truth documents live in `_config/`.
- **Onboarding in chat**: when the user wants to start a new novel, run the Path A agent-led interview from `stages/01_onboarding/CONTEXT.md` yourself — do not send the user to the terminal wizard.
- **Dual launch profiles** (subscription switching): `powershell -File ./scripts/claude-vanilla.ps1` (standard Anthropic auth) · `powershell -File ./scripts/claude-openrouter.ps1` (OpenRouter via `.env`).
