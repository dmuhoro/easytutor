# AI Agent Entry Point: Engineering OS v2

This repository is an AI-native engineering ecosystem. Every autonomous action MUST follow this protocol.

## 1. Context Acquisition
- Read `ai-context/*` to understand the product and architecture.
- Read `AGENTS.md` to understand your operational role (see `/agents`).

## 2. Pre-Implementation Validation
- Verify that a spec exists in `/specs/in-progress`.
- Check `ai-context/architecture.md` for non-negotiable invariants.
- Ensure no boundary violations (run `node scripts/architecture/validate_boundaries.js`).

## 3. Scoped Execution
- Implement ONE unit at a time.
- Use defensive programming (timeouts, retries).
- Never modify stable logic unnecessarily.

## 4. Post-Implementation Documentation
- Update `ai-context/current_state.md`.
- Record lessons in `/memory/lessons-learned.md`.
- Generate an audit trail in the spec file.

## 5. Verification
- Run `node scripts/qa/qa_runner.js`.
- All steps MUST pass before completion.

---

# Deterministic Invariants
1. **Spec-Driven:** No code without a spec.
2. **Boundary-Safe:** No UI direct DB calls.
3. **Memory-Persistent:** Record every failure and lesson.
4. **Verified:** No completion without QA pass.
