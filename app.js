const productGrid = document.getElementById("product-grid");
const categoryGrid = document.getElementById("category-grid");
const searchInput = document.getElementById("search");

const profileSection = document.getElementById("product-profile");
const profileName = document.getElementById("profile-name");
const profileContent = document.getElementById("profile-content");
const backToDiscoveries = document.getElementById("back-to-discoveries");

let products = [];
let activeCategory = "All";
let selectedForComparison = new Set();

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getCategories() {
  return [
    "All",
    ...new Set(
      products
        .map(product => product.category)
        .filter(Boolean)
    )
  ];
}

function getReferralStatus(product) {
  return product.referral?.status || "not-connected";
}

function formatReferralStatus(status) {
  const labels = {
    "not-connected": "Not connected",
    "pending-verification": "Pending verification",
    "verified": "Verified",
    "inactive": "Inactive"
  };

  return labels[status] || status;
}

function renderReferralDesk(product) {
  const referral = product.referral || {};
  const status = getReferralStatus(product);

  return `
    <div class="verification">

      <strong>GCH Referral Desk</strong>

      <p>
        <strong>Referral Status:</strong>
        ${escapeHtml(formatReferralStatus(status))}
      </p>

      ${
        referral.program
          ? `
            <p>
              <strong>Program:</strong>
              ${escapeHtml(referral.program)}
            </p>
          `
          : ""
      }

      ${
        referral.network
          ? `
            <p>
              <strong>Network:</strong>
              ${escapeHtml(referral.network)}
            </p>
          `
          : ""
      }

      ${
        referral.verifiedBy
          ? `
            <p>
              <strong>Referral Verified By:</strong>
              ${escapeHtml(referral.verifiedBy)}
            </p>
          `
          : ""
      }

      ${
        referral.verifiedAt
          ? `
            <p>
              <strong>Referral Verified:</strong>
              ${escapeHtml(referral.verifiedAt)}
            </p>
          `
          : ""
      }

      ${
        referral.referralUrl
          ? `
            <p>
              <a
                href="${escapeHtml(referral.referralUrl)}"
                target="_blank"
                rel="noopener noreferrer"
                class="button"
              >
                Open Referral Link
              </a>
            </p>
          `
          : ""
      }

    </div>
  `;
}

function renderProductStats() {
  const heading = document.querySelector("#discovery-desk .section-heading");

  if (!heading || document.getElementById("gch-catalogue-stats")) {
    return;
  }

  const stats = document.createElement("div");
  stats.id = "gch-catalogue-stats";

  stats.innerHTML = `
    <p>
      <strong>${products.length}</strong>
      verified ${products.length === 1 ? "discovery" : "discoveries"}
      across
      <strong>${getCategories().length - 1}</strong>
      ${getCategories().length - 1 === 1 ? "category" : "categories"}.
    </p>
  `;

  heading.appendChild(stats);
}

function renderCompareBar() {
  let compareBar = document.getElementById("gch-compare-bar");

  if (!compareBar) {
    compareBar = document.createElement("div");
    compareBar.id = "gch-compare-bar";

    const discoveryDesk = document.getElementById("discovery-desk");

    if (discoveryDesk) {
      discoveryDesk.insertBefore(
        compareBar,
        productGrid
      );
    }
  }

  if (!selectedForComparison.size) {
    compareBar.innerHTML = "";
    compareBar.hidden = true;
    return;
  }

  const selectedProducts = products.filter(product =>
    selectedForComparison.has(product.id)
  );

  compareBar.hidden = false;

  compareBar.innerHTML = `
    <div class="compare-bar-content">

      <div>
        <p class="eyebrow">GCH COMPARE</p>

        <strong>
          ${selectedProducts.length}
          ${selectedProducts.length === 1 ? "discovery" : "discoveries"}
          selected
        </strong>

        <p>
          Select two or more verified discoveries to compare them.
        </p>
      </div>

      <div class="product-actions">

        <button
          type="button"
          class="button"
          id="compare-selected"
          ${selectedProducts.length < 2 ? "disabled" : ""}
        >
          Compare Selected
        </button>

        <button
          type="button"
          class="button"
          id="clear-comparison"
        >
          Clear Selection
        </button>

      </div>

    </div>
  `;

  // Keep actions attached to the stable compare bar rather than
  // to buttons that are replaced every time the bar is re-rendered.
  if (!compareBar.dataset.actionsBound) {
    compareBar.addEventListener("click", event => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest("#clear-comparison")) {
        clearComparison();
      } else if (target.closest("#compare-selected")) {
        renderComparison();
      }
    });

    compareBar.dataset.actionsBound = "true";
  }

function renderProducts(items) {
  if (!items.length) {
    productGrid.innerHTML = `
      <div class="empty">
        No verified discoveries match your search.
      </div>
    `;

    renderCompareBar();
    return;
  }

  productGrid.innerHTML = items.map(product => {
    const selected =
      selectedForComparison.has(product.id);

    return `
      <article class="product-card">

        <p class="eyebrow">VERIFIED DISCOVERY</p>

        <h3>${escapeHtml(product.name)}</h3>

        <p class="product-category">
          ${escapeHtml(product.category)}
        </p>

        <p>
          ${escapeHtml(product.description)}
        </p>

        <p class="verification">
          ✓ Verified by
          ${escapeHtml(product.verification?.source || "GCH")}
        </p>

        <div class="product-actions">

          <button
            type="button"
            class="button"
            data-profile-id="${escapeHtml(product.id)}"
          >
            View GCH Discovery
          </button>

          <button
            type="button"
            class="button"
            data-compare-id="${escapeHtml(product.id)}"
            aria-pressed="${selected}"
          >
            ${selected ? "✓ Selected" : "Compare"}
          </button>

          ${
            product.officialUrl
              ? `
                <a
                  href="${escapeHtml(product.officialUrl)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="button"
                >
                  Explore Official Site
                </a>
              `
              : ""
          }

        </div>

      </article>
    `;
  }).join("");

  renderCompareBar();
}

function renderCategories() {
  const categories = getCategories();

  categoryGrid.innerHTML = categories.map(category => {
    const count =
      category === "All"
        ? products.length
        : products.filter(
            product => product.category === category
          ).length;

    const selected =
      activeCategory === category;

    return `
      <button
        type="button"
        class="category-card"
        data-category="${escapeHtml(category)}"
        aria-pressed="${selected}"
      >
        <h3>${escapeHtml(category)}</h3>

        <p>
          ${count} verified
          ${count === 1 ? "discovery" : "discoveries"}
        </p>
      </button>
    `;
  }).join("");

  categoryGrid
    .querySelectorAll("[data-category]")
    .forEach(button => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.category;
        renderCategories();
        applyFilters();
      });
    });
}

function applyFilters() {
  const query = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

  const filtered = products.filter(product => {
    const matchesCategory =
      activeCategory === "All" ||
      product.category === activeCategory;

    const searchableText = [
      product.name,
      product.category,
      product.description,
      product.merchant
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !query ||
      searchableText.includes(query);

    return matchesCategory && matchesSearch;
  });

  renderProducts(filtered);

  const existingCount =
    document.getElementById("gch-result-count");

  if (existingCount) {
    existingCount.textContent =
      `${filtered.length} verified ${
        filtered.length === 1
          ? "discovery"
          : "discoveries"
      } shown`;
  }
}

function toggleComparison(productId) {
  if (selectedForComparison.has(productId)) {
    selectedForComparison.delete(productId);
  } else {
    selectedForComparison.add(productId);
  }

  applyFilters();
}

function clearComparison() {
  // Clear the selection state first, then explicitly reset both
  // comparison interfaces so no stale panel remains visible.
  selectedForComparison.clear();

  removeComparisonView();

  const compareBar =
    document.getElementById("gch-compare-bar");

  if (compareBar) {
    compareBar.innerHTML = "";
    compareBar.hidden = true;
  }

  applyFilters();
}

function renderComparison() {
  const selectedProducts = products.filter(product =>
    selectedForComparison.has(product.id)
  );

  if (selectedProducts.length < 2) {
    return;
  }

  let comparisonSection =
    document.getElementById("gch-comparison");

  if (!comparisonSection) {
    comparisonSection = document.createElement("section");
    comparisonSection.id = "gch-comparison";
    comparisonSection.className = "section";

    const discoveryDesk =
      document.getElementById("discovery-desk");

    if (discoveryDesk) {
      discoveryDesk.insertAdjacentElement(
        "afterend",
        comparisonSection
      );
    }
  }

  comparisonSection.innerHTML = `
    <div class="section-heading">

      <div>
        <p class="eyebrow">GCH COMPARE</p>
        <h2>Compare Verified Discoveries</h2>

        <p>
          Compare the verified information currently available
          in the GCH catalogue.
        </p>
      </div>

    </div>

    <div class="product-grid">

      ${selectedProducts.map(product => `
        <article class="product-card">

          <p class="eyebrow">
            VERIFIED DISCOVERY
          </p>

          <h3>
            ${escapeHtml(product.name)}
          </h3>

          <p class="product-category">
            ${escapeHtml(product.category)}
          </p>

          <p>
            ${escapeHtml(product.description)}
          </p>

          <p>
            <strong>Merchant:</strong>
            ${escapeHtml(product.merchant || "Not specified")}
          </p>

          <div class="verification">

            <strong>Verification</strong>

            <p>
              ✓ Verified by
              ${escapeHtml(
                product.verification?.source || "GCH"
              )}
            </p>

            ${
              product.verification?.verifiedAt
                ? `
                  <p>
                    Verified:
                    ${escapeHtml(
                      product.verification.verifiedAt
                    )}
                  </p>
                `
                : ""
            }

          </div>

          ${renderReferralDesk(product)}

          ${
            product.officialUrl
              ? `
                <p>
                  <a
                    href="${escapeHtml(product.officialUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="button"
                  >
                    Explore Official Site
                  </a>
                </p>
              `
              : ""
          }

        </article>
      `).join("")}

    </div>

    <div class="product-actions">

      <button
        type="button"
        class="button"
        id="comparison-back-to-discoveries"
      >
        Back to Discoveries
      </button>

      <button
        type="button"
        class="button"
        id="comparison-clear"
      >
        Clear Comparison
      </button>

    </div>
  `;

  const backButton =
    document.getElementById(
      "comparison-back-to-discoveries"
    );

  const clearButton =
    document.getElementById(
      "comparison-clear"
    );

  if (backButton) {
    backButton.addEventListener(
      "click",
      () => {
        const discoveryDesk = document.getElementById("discovery-desk");

        if (discoveryDesk) {
          discoveryDesk.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      }
    );
  }

  if (clearButton) {
    clearButton.addEventListener(
      "click",
      clearComparison
    );
  }

  comparisonSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function removeComparisonView() {
  const comparisonSection =
    document.getElementById("gch-comparison");

  if (comparisonSection) {
    comparisonSection.remove();
  }
}

function openProductProfile(productId) {
  const product = products.find(
    item =>
      String(item.id) === String(productId)
  );

  if (
    !product ||
    !profileSection ||
    !profileName ||
    !profileContent
  ) {
    return;
  }

  profileName.textContent =
    product.name;

  profileContent.innerHTML = `
    <article class="product-profile-card">

      <p class="eyebrow">
        VERIFIED DISCOVERY
      </p>

      <h3>
        ${escapeHtml(product.name)}
      </h3>

      <p class="product-category">
        ${escapeHtml(product.category)}
      </p>

      <p>
        ${escapeHtml(product.description)}
      </p>

      <div class="verification">

        <strong>Verification</strong>

        <p>
          ✓ Verified by
          ${escapeHtml(
            product.verification?.source || "GCH"
          )}
        </p>

        ${
          product.verification?.verifiedAt
            ? `
              <p>
                Verified:
                ${escapeHtml(
                  product.verification.verifiedAt
                )}
              </p>
            `
            : ""
        }

      </div>

      ${
        product.merchant
          ? `
            <p>
              <strong>Merchant:</strong>
              ${escapeHtml(product.merchant)}
            </p>
          `
          : ""
      }

      ${renderReferralDesk(product)}

      ${
        product.officialUrl
          ? `
            <p>
              <a
                href="${escapeHtml(product.officialUrl)}"
                target="_blank"
                rel="noopener noreferrer"
                class="button"
              >
                Explore Official Site
              </a>
            </p>
          `
          : ""
      }

    </article>
  `;

  profileSection.hidden = false;

  profileSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function closeProductProfile() {
  if (!profileSection) {
    return;
  }

  profileSection.hidden = true;

  const discoveryDesk =
    document.getElementById(
      "discovery-desk"
    );

  if (discoveryDesk) {
    discoveryDesk.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

async function loadCatalogue() {
  try {
    const response =
      await fetch("products.json", {
        cache: "no-store"
      });

    if (!response.ok) {
      throw new Error(
        `Catalogue request failed: ${response.status}`
      );
    }

    const catalogue =
      await response.json();

    products =
      Array.isArray(catalogue.products)
        ? catalogue.products.filter(
            product =>
              product.verification?.status ===
              "verified"
          )
        : [];

    renderProductStats();
    renderCategories();

    const resultCount =
      document.createElement("p");

    resultCount.id =
      "gch-result-count";

    resultCount.textContent =
      `${products.length} verified ${
        products.length === 1
          ? "discovery"
          : "discoveries"
      } shown`;

    productGrid.parentNode.insertBefore(
      resultCount,
      productGrid
    );

    applyFilters();

  } catch (error) {
    console.error(
      "GCH catalogue error:",
      error
    );

    productGrid.innerHTML = `
      <div class="empty">
        The verified catalogue could not be loaded.
        Please try again shortly.
      </div>
    `;
  }
}

if (productGrid) {
  productGrid.addEventListener(
    "click",
    event => {

      const profileButton =
        event.target.closest(
          "[data-profile-id]"
        );

      if (
        profileButton &&
        productGrid.contains(profileButton)
      ) {
        event.preventDefault();

        openProductProfile(
          profileButton.dataset.profileId
        );

        return;
      }

      const compareButton =
        event.target.closest(
          "[data-compare-id]"
        );

      if (
        compareButton &&
        productGrid.contains(compareButton)
      ) {
        event.preventDefault();

        toggleComparison(
          compareButton.dataset.compareId
        );
      }

    }
  );
}

if (searchInput) {
  searchInput.addEventListener(
    "input",
    applyFilters
  );
}

if (backToDiscoveries) {
  backToDiscoveries.addEventListener(
    "click",
    closeProductProfile
  );
}

loadCatalogue();
