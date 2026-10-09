document.addEventListener("click", async function (event) {
  const removeButton = event.target.closest(".remove-item");
  if (!removeButton) return;

  // Find the cart item's Shopify line-item key
  const cartItem = removeButton.closest("[data-cart-item-key]");
  const itemKey = cartItem?.dataset.cartItemKey;

  if (!itemKey) {
    console.error("Missing data-cart-item-key on this cart item.");
    return;
  }

  removeButton.disabled = true;

  try {
    const response = await fetch(
      window.Shopify.routes.root + "cart/change.js",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          id: itemKey,
          quantity: 0,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Could not remove cart item.");
    }

    // Reload using Shopify's updated cart data.
    window.location.reload();
  } catch (error) {
    console.error("Remove item error:", error);
    removeButton.disabled = false;
    alert("Could not remove this product. Please try again.");
  }
});
