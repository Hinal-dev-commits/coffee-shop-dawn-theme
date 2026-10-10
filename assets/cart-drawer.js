// assets/cart-drawer.js
// Works on the local dev server AND inside the Shopify theme editor.
// Everything is attached to `document` (event delegation), so it keeps working
// when the editor re-renders a section. A guard stops it from binding twice
// if the editor re-runs this script.

(() => {
  if (window.__cartDrawerLoaded) return;
  window.__cartDrawerLoaded = true;

  const SECTION_ID = "cart-drawer";
  const MIN_QTY = 1;
  const DEFAULT_MAX_QTY = 6; // only used if data-max-qty is missing
  const root = window.Shopify?.routes?.root || "/";

  const getDrawer = () => document.getElementById("cartDrawer");
  const getOverlay = () => document.getElementById("cartOverlay");

  // The max is set once in snippets/cart-drawer.liquid (max_qty -> data-max-qty)
  const getMaxQty = () => Number(getDrawer()?.dataset.maxQty) || DEFAULT_MAX_QTY;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  // How many of this variant are already in the cart?
  const getQuantityInCart = async (variantId) => {
    const res = await fetch(root + "cart.js", {
      headers: { Accept: "application/json" },
    });
    const cart = await res.json();
    return cart.items
      .filter((item) => String(item.variant_id) === String(variantId))
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  // --- 1. OPEN / CLOSE ---------------------------------------------------
  const openCart = () => {
    getDrawer()?.classList.add("is-open");
    getOverlay()?.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  const closeCart = () => {
    getDrawer()?.classList.remove("is-open");
    getOverlay()?.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  // --- 2. RE-RENDER THE DRAWER FROM SHOPIFY'S SECTION HTML ---------------
  const renderDrawer = (sectionHtml) => {
    if (!sectionHtml) return;
    const doc = new DOMParser().parseFromString(sectionHtml, "text/html");
    const newDrawer = doc.getElementById("cartDrawer");
    const drawer = getDrawer();
    if (newDrawer && drawer) {
      // Swap only the contents so the "is-open" class stays on the element.
      drawer.innerHTML = newDrawer.innerHTML;
    }
  };

  // --- 3. CHANGE QUANTITY / REMOVE ---------------------------------------
  // `line` is the 1-based position of the item in the cart. quantity 0 removes it.
  const changeLine = async (line, quantity) => {
    try {
      const response = await fetch(root + "cart/change.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          line,
          quantity,
          sections: SECTION_ID,
          sections_url: window.location.pathname,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.description || data.message);

      renderDrawer(data.sections?.[SECTION_ID]);
    } catch (error) {
      console.error("Error updating cart:", error);
      alert(error.message || "Could not update the cart.");
    }
  };

  // --- 4. CLICKS (close, open from header icon, +/-, remove) -------------
  document.addEventListener("click", (e) => {
    if (e.target.closest(".cart-close") || e.target.closest("#cartOverlay")) {
      closeCart();
      return;
    }

    const opener = e.target.closest("[data-cart-open]");
    if (opener) {
      e.preventDefault();
      openCart();
      return;
    }

    const btn = e.target.closest('[data-cart-action="change"]');
    if (btn) {
      const qty = Number(btn.dataset.quantity);
      // 0 means "Remove". Anything else stays between MIN_QTY and the max.
      changeLine(
        Number(btn.dataset.line),
        qty === 0 ? 0 : clamp(qty, MIN_QTY, getMaxQty()),
      );
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCart();
  });

  // Typing a quantity directly
  document.addEventListener("change", (e) => {
    const input = e.target.closest("[data-cart-input]");
    if (input) {
      // Typed values are forced into the allowed range (use Remove to delete)
      const qty = clamp(parseInt(input.value, 10) || MIN_QTY, MIN_QTY, getMaxQty());
      input.value = qty;
      changeLine(Number(input.dataset.line), qty);
    }
  });

  // --- 5. ADD TO CART ----------------------------------------------------
  // Listening on `document` (not on one form) means it still works after the
  // theme editor re-renders the product section and replaces the form.
  //
  // NOTE: we match with *= (contains), not $= (ends with). Inside the theme
  // editor Shopify adds "?oseid=..." to the form action, so it becomes
  // "/cart/add?oseid=..." and an "ends with /cart/add" check would miss it.
  document.addEventListener("submit", async (event) => {
    const form = event.target.closest?.('form[action*="/cart/add"]');
    if (!form) return;

    event.preventDefault();

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const formData = new FormData(form);

      // Respect the max: count what is already in the cart for this variant
      const max = getMaxQty();
      const wanted = clamp(parseInt(formData.get("quantity"), 10) || MIN_QTY, MIN_QTY, max);
      const inCart = await getQuantityInCart(formData.get("id"));
      const allowed = max - inCart;

      if (allowed <= 0) {
        alert(`You already have the maximum of ${max} in your cart.`);
        openCart();
        return; // the finally block below re-enables the button
      }

      if (wanted > allowed) {
        alert(`Only ${allowed} more can be added (maximum ${max} per product).`);
      }
      formData.set("quantity", Math.min(wanted, allowed));

      // Ask Shopify to send back the re-rendered section in the same response
      formData.append("sections", SECTION_ID);
      formData.append("sections_url", window.location.pathname);

      const response = await fetch(root + "cart/add.js", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.description || data.message || "Failed to add item");
      }

      renderDrawer(data.sections?.[SECTION_ID]);
      openCart();
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert(error.message || "Something went wrong. Please try again.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // --- 6. THEME EDITOR: if the drawer section is reloaded, close it ------
  document.addEventListener("shopify:section:load", (e) => {
    if (e.target.id === "shopify-section-" + SECTION_ID) closeCart();
  });
})();