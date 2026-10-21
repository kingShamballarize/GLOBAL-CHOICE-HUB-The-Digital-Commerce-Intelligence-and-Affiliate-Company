"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  evaluateDiscovery,
  evaluateReferral,
  scoreOpportunity,
  buildPortfolioSnapshot
} = require("./core.js");

const verifiedProduct = {
  id: "GCH-TEST-001",
  name: "Example Product",
  category: "Test Category",
  description: "A test description.",
  officialUrl: "https://example.com/",
  verification: {
    status: "verified",
    source: "Official website",
    sourceUrl: "https://example.com/",
    verifiedAt: "2026-10-21"
  }
};

test("accepts discovery only when required evidence fields are present", () => {
  assert.equal(evaluateDiscovery(verifiedProduct).eligibleForVerifiedCatalogue, true);
  const incomplete = evaluateDiscovery({ ...verifiedProduct, verification: { status: "verified" } });
  assert.equal(incomplete.eligibleForVerifiedCatalogue, false);
  assert.ok(incomplete.issues.includes("missing-verification-source"));
});

test("does not confuse discovery verification with affiliate readiness", () => {
  assert.equal(evaluateDiscovery(verifiedProduct).eligibleForVerifiedCatalogue, true);
  assert.equal(evaluateReferral({ status: "not-connected" }).eligibleForReferral, false);
});

test("affiliate readiness requires explicit approval, product connection and link test evidence", () => {
  const referral = {
    status: "verified",
    program: "Example Partner Program",
    network: "Example Network",
    accountStatus: "approved",
    productConnected: true,
    referralUrl: "https://example.com/referral",
    linkTestedAt: "2026-10-21",
    verifiedBy: "GCH",
    verifiedAt: "2026-10-21"
  };
  assert.equal(evaluateReferral(referral).eligibleForReferral, true);
  assert.equal(evaluateReferral({ ...referral, productConnected: false }).eligibleForReferral, false);
});

test("does not produce a complete opportunity score when factors are missing", () => {
  const partial = scoreOpportunity({ relevance: 5, demandEvidence: 4 });
  assert.equal(partial.score, null);
  assert.equal(partial.status, "insufficient-evidence");
  assert.equal(partial.coveragePercent, 40);
});

test("scores a fully evidenced opportunity on a transparent 0–100 scale", () => {
  const score = scoreOpportunity({
    relevance: 5,
    demandEvidence: 5,
    evidenceAvailability: 5,
    affiliatePotential: 5,
    competitionEase: 5
  });
  assert.equal(score.score, 100);
  assert.equal(score.coveragePercent, 100);
  assert.equal(score.status, "scored");
});

test("portfolio snapshot counts only evidence-complete discoveries as verified", () => {
  const snapshot = buildPortfolioSnapshot({
    products: [verifiedProduct, { id: "GCH-TEST-002", category: "Test Category" }]
  });
  assert.equal(snapshot.totalRecords, 2);
  assert.equal(snapshot.verifiedDiscoveryCount, 1);
  assert.equal(snapshot.needsEvidenceReviewCount, 1);
  assert.equal(snapshot.referralReadyCount, 0);
});
