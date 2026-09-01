# 1. Record Architecture Decisions

Date: 2026-09-02

## Status
Accepted

## Context
CosmoScan requires a disciplined, traceable record of technical, architectural, and scientific decisions made throughout the engineering lifecycle. Architectural trade-offs—such as using procedural GPU particle kinematics rather than pre-rendered textures, employing Mandel-Agol quadratic limb darkening rather than linear models, and storing pre-computed vector caches rather than synchronous API fetching—need clear rationale and consequence documentation.

## Decision
We adopt the Michael Nygard Architecture Decision Record (ADR) format. Every significant deviation from the master execution document, library adoption, shader mathematical model, or scientific formula simplification must be formally recorded in `docs/adr/NNNN-title.md` with the following sections:
- Title
- Date
- Status (Proposed, Accepted, Deprecated, Superseded)
- Context
- Decision
- Consequences (Positive, Negative, Risks)

## Consequences
- **Positive**: Complete traceability for science-fair evaluators, open-source contributors, and subsequent development teams. Clear documentation of physical approximations.
- **Negative**: Adds a minor authoring overhead whenever architectural or physics changes occur.
