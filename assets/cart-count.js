(function () {
  if (window.__cartCountInit) return;
  window.__cartCountInit = true;

  var originalFetch = window.fetch;
  var root = (window.Shopify && Shopify.routes && Shopify.routes.root) || "/";

  function render(count) {
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = count;
      el.hidden = count === 0;
    });
  }

  function refresh() {
    return originalFetch(root + "cart.js", {
      headers: { Accept: "application/json" },
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (cart) {
        render(cart.item_count);
        return cart;
      })
      .catch(function () {});
  }

  // Update the badge whenever the theme's own code changes the cart through fetch
  window.fetch = function () {
    var input = arguments[0];
    var url = typeof input === "string" ? input : (input && input.url) || "";
    var isCartChange = /\/cart\/(add|change|update|clear)/.test(url);
    return originalFetch.apply(this, arguments).then(function (response) {
      if (isCartChange) refresh();
      return response;
    });
  };

  // Manual hooks, e.g. from your cart drawer code
  window.updateCartCount = refresh;
  document.addEventListener("cart:updated", refresh);

  // Fix stale count when the user returns with the back button
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) refresh();
  });
})();
