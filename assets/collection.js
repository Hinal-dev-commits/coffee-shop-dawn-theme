document.addEventListener("DOMContentLoaded", function () {
  const categoriesEl = document.getElementById("collection-categories");
  const resultsEl = document.getElementById("collection-results");

  if (!categoriesEl || !resultsEl) return;

  async function loadPage(url, push = true) {
    resultsEl.style.opacity = "0.6";
    resultsEl.style.pointerEvents = "none";

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Request failed");

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");

      const newCategories = doc.getElementById("collection-categories");
      const newResults = doc.getElementById("collection-results");
      if (!newCategories || !newResults) throw new Error("Markup not found");

      categoriesEl.innerHTML = newCategories.innerHTML;
      resultsEl.innerHTML = newResults.innerHTML;

      // Update the page heading and description for the new collection
      ["h1", ".collection-description"].forEach((selector) => {
        const current = document.querySelector(
          ".collection-header " + selector,
        );
        const next = doc.querySelector(".collection-header " + selector);
        if (current && next) current.innerHTML = next.innerHTML;
      });

      if (doc.title) document.title = doc.title;
      if (push) window.history.pushState({}, "", url);
    } catch (error) {
      // If anything fails, fall back to a normal page load
      window.location.href = url;
      return;
    }

    resultsEl.style.opacity = "1";
    resultsEl.style.pointerEvents = "";
  }

  // Collection buttons (All, Coffee Beans, ...)
  categoriesEl.addEventListener("click", function (event) {
    const link = event.target.closest("a");
    if (!link) return;
    event.preventDefault();
    loadPage(link.href);
  });

  // Pagination links
  resultsEl.addEventListener("click", function (event) {
    const link = event.target.closest(".collection-pagination a");
    if (!link) return;
    event.preventDefault();
    loadPage(link.href).then(() => {
      categoriesEl.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Sort dropdown
  resultsEl.addEventListener("change", function (event) {
    const select = event.target.closest("[data-collection-sort]");
    if (!select) return;

    const url = new URL(window.location.href);
    url.searchParams.set("sort_by", select.value);
    url.searchParams.delete("page");
    loadPage(url.toString());
  });

  // Browser back and forward buttons
  window.addEventListener("popstate", function () {
    loadPage(window.location.href, false);
  });
});

async function loadPage(url, push = true) {
  const fadeTimer = setTimeout(() => {
    resultsEl.style.opacity = "0.6";
  }, 300);

  try {
    // ... keep the existing fetch and swap code here ...
  } catch (error) {
    clearTimeout(fadeTimer);
    window.location.href = url;
    return;
  }

  clearTimeout(fadeTimer);
  resultsEl.style.opacity = "1";
}
