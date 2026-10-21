"use strict";

/**
 * Global Choice Hub Intelligence Engine — deterministic foundation.
 * This module evaluates only supplied evidence. It does not browse, invent
 * market facts, approve affiliate programs, or change catalogue records.
 */

const OPPORTUNITY_WEIGHTS = Object.freeze({
  relevance: 30,
  demandEvidence: 25,
  evidenceAvailability: 20,
  affiliatePotential: 15,
  competitionEase: 10
});

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isHttpsUrl(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function evaluateDiscovery(product) {
  const item = product && typeof product === "object" ? product : {};
  const issues = [];

  if (!isNonEmptyString(item.id)) issues.push("missing-id");
  if (!isNonEmptyString(item.name)) issues.push("missing-name");
  if (!isNonEmptyString(item.category)) issues.push("missing-category");
  if (!isNonEmptyString(item.description)) issues.push("missing-description");
  if (!isHttpsUrl(item.officialUrl)) issues.push("missing-valid-official-url");

  const verification = item.verification && typeof item.verification === "object"
    ? item.verification
    : {};

  if (verification.status !== "verified") issues.push("verification-not-confirmed");
  if (!isNonEmptyString(verification.source)) issues.push("missing-verification-source");
  if (!isHttpsUrl(verification.sourceUrl)) issues.push("missing-verification-source-url");
  if (!isNonEmptyString(verification.verifiedAt)) issues.push("missing-verification-date");

  return Object.freeze({
    productId: isNonEmptyString(item.id) ? item.id : null,
    eligibleForVerifiedCatalogue: issues.length === 0,
    issues
  });
}

/**
 * Referral readiness is intentionally stricter than product discovery.
 * A product can be a verified discovery without being affiliate-ready.
 * No status is upgraded or written back by this function.
 */
function evaluateReferral(referral) {
  const item = referral && typeof referral === "object" ? referral : {};
  const issues = [];

  if (item.status !== "verified") issues.push("referral-status-not-verified");
  if (!isNonEmptyString(item.program)) issues.push("missing-program");
  if (!isNonEmptyString(item.network)) issues.push("missing-network");
  if (item.accountStatus !== "approved") issues.push("account-not-confirmed-approved");
  if (item.productConnected !== true) issues.push("product-connection-not-confirmed");
  if (!isHttpsUrl(item.referralUrl)) issues.push("missing-valid-referral-url");
  if (!isNonEmptyString(item.linkTestedAt)) issues.push("missing-link-test-date");
  if (!isNonEmptyString(item.verifiedBy)) issues.push("missing-verifier");
  if (!isNonEmptyString(item.verifiedAt)) issues.push("missing-verification-date");

  return Object.freeze({
    eligibleForReferral: issues.length === 0,
    issues
  });
}

/**
 * Scores must be evidence-backed inputs from 0 to 5.
 * No partial score is presented as a complete ranking.
 * competitionEase means 5 = easier/less competitive, 0 = harder/more competitive.
 */
function scoreOpportunity(factors) {
  const item = factors && typeof factors === "object" ? factors : {};
  const keys = Object.keys(OPPORTUNITY_WEIGHTS);
  const missing = [];
  const invalid = [];

  for (const key of keys) {
    if (item[key] === undefined || item[key] === null) {
      missing.push(key);
    } else if (typeof item[key] !== "number" || !Number.isFinite(item[key]) || item[key] < 0 || item[key] > 5) {
      invalid.push(key);
    }
  }

  if (invalid.length) {
    return Object.freeze({
      score: null,
      coveragePercent: Math.round(((keys.length - missing.length - invalid.length) / keys.length) * 100),
      status: "invalid-input",
      missing,
      invalid
    });
  }

  const suppliedCount = keys.length - missing.length;
  const coveragePercent = Math.round((suppliedCount / keys.length) * 100);

  if (missing.length) {
    return Object.freeze({
      score: null,
      coveragePercent,
      status: "insufficient-evidence",
      missing,
      invalid: []
    });
  }

  const totalWeight = keys.reduce((sum, key) => sum + OPPORTUNITY_WEIGHTS[key], 0);
  const weighted = keys.reduce(
    (sum, key) => sum + (item[key] / 5) * OPPORTUNITY_WEIGHTS[key],
    0
  );

  return Object.freeze({
    score: Math.round((weighted / totalWeight) * 100),
    coveragePercent: 100,
    status: "scored",
    missing: [],
    invalid: []
  });
}

function buildPortfolioSnapshot(catalogue) {
  const items = catalogue && Array.isArray(catalogue.products)
    ? catalogue.products
    : [];

  const discoveryResults = items.map(evaluateDiscovery);
  const verifiedDiscoveryCount = discoveryResults.filter(
    result => result.eligibleForVerifiedCatalogue
  ).length;
  const referralReadyCount = items.filter(product =>
    evaluateReferral(product && product.referral).eligibleForReferral
  ).length;

  const categoryCounts = {};
  for (const product of items) {
    if (isNonEmptyString(product && product.category)) {
      categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
    }
  }

  return Object.freeze({
    totalRecords: items.length,
    verifiedDiscoveryCount,
    needsEvidenceReviewCount: items.length - verifiedDiscoveryCount,
    referralReadyCount,
    categoryCounts,
    generatedFrom: "supplied-catalogue-data",
    makesExternalClaims: false
  });
}

module.exports = {
  OPPORTUNITY_WEIGHTS,
  evaluateDiscovery,
  evaluateReferral,
  scoreOpportunity,
  buildPortfolioSnapshot
};
