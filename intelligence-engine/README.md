# Global Choice Hub Intelligence Engine™

## Purpose
The Intelligence Engine is GCH's evidence-led decision-support layer. It helps organise discovery quality, referral readiness, opportunity evaluation and portfolio reporting. It is designed to complement the existing GCH website and catalogue, not replace them.

## Current foundation
- `core.js`: deterministic, testable rules for discovery evidence, affiliate referral readiness, opportunity scoring and catalogue snapshots.
- `core.test.js`: Node.js built-in tests for key safeguards and calculations.
- This first slice does not call an AI model, browse the web, contact merchants, modify the production catalogue, or deploy itself.

## Non-negotiable safeguards
1. Product discovery verification and affiliate approval are separate states.
2. A product is not referral-ready merely because its official website is valid.
3. Referral readiness requires explicit evidence of program/network, approved GCH account, product connection, HTTPS referral URL, link-test date, verifier and verification date.
4. Opportunity scores are not invented. All five evidence-backed factors must be supplied before a complete 0–100 score is returned.
5. Missing or invalid evidence is surfaced, not silently filled in.
6. This module returns assessments; it does not write changes to catalogue records or approve commercial actions.

## Opportunity factors
Each factor is an evidence-backed input from 0 to 5:
- Relevance (30%): fit with GCH's chosen audience and strategic scope.
- Demand evidence (25%): strength of documented buyer/search demand.
- Evidence availability (20%): how well claims can be checked against trustworthy sources.
- Affiliate potential (15%): evidence of a legitimate, relevant commercial programme and plausible referral fit; not a promise of earnings.
- Competition ease (10%): 5 means easier/less competitive; 0 means harder/more competitive.

A score is returned only when all five factors are present and valid. The score is a prioritisation aid, not a forecast of sales or revenue.

## How to test
With Node.js installed, run from the repository root:

```sh
node --test intelligence-engine/core.test.js
```

## Roadmap
1. Foundation rules and tests (this commit).
2. Add a read-only audit report for the current `products.json` catalogue.
3. Add source/date/verifier tracking and referral verification workflow.
4. Add buyer-question and search-intent research records with citations and review dates.
5. Add transparent opportunity scoring only for candidates with documented inputs.
6. Add an admin view and approved, auditable catalogue update workflow.
7. Connect performance data (e.g. Search Console and referral analytics) only after permissions and data sources are configured.
8. Automate scheduled checks with logs, retries, alerts and human approval for consequential actions.

## Deployment
This foundation is isolated under `intelligence-engine/` and is not wired into the live page yet. It should be tested and reviewed before merging or connecting it to production.
