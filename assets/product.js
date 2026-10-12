console.log("product.js loaded");
document.addEventListener("DOMContentLoaded", function () {
  const thumbsEl = document.querySelector(".thumbs-swiper");
  const mainEl = document.querySelector(".main-swiper");

  if (!thumbsEl || !mainEl || typeof Swiper === "undefined") return;

  // --- 1. STORE ORIGINAL SLIDES ---
  // Save the raw HTML of all images before Swiper modifies the DOM
  const originalThumbs = Array.from(
    thumbsEl.querySelectorAll(".swiper-slide"),
  ).map((slide) => ({
    id: parseInt(slide.dataset.mediaId),
    html: slide.outerHTML,
  }));

  const originalMains = Array.from(
    mainEl.querySelectorAll(".swiper-slide"),
  ).map((slide) => ({
    id: parseInt(slide.dataset.mediaId),
    html: slide.outerHTML,
  }));

  // --- 2. INITIALIZE SWIPER ---
  let thumbsSwiper = new Swiper(thumbsEl, {
    slidesPerView: "auto",
    spaceBetween: 12,
    freeMode: true,
    watchSlidesProgress: true,
    direction: "horizontal",
    breakpoints: { 701: { direction: "vertical" } },
  });

  let mainSwiper = new Swiper(mainEl, {
    spaceBetween: 10,
    navigation: {
      nextEl: document.querySelector(".swiper-button-next"),
      prevEl: document.querySelector(".swiper-button-prev"),
    },
    thumbs: { swiper: thumbsSwiper },
  });

  // --- 3. VARIANT SELECTION & FILTERING LOGIC ---
  const optionsContainer = document.getElementById("product-options");
  const variantJsonScript = document.getElementById("product-variants-json");

  if (optionsContainer && variantJsonScript) {
    const variants = JSON.parse(variantJsonScript.textContent);
    const hiddenInput = document.querySelector('input[name="id"]');
    const priceDisplay = document.querySelector(".price");
    const formInputs = optionsContainer.querySelectorAll('input[type="radio"]');

    // Create a list of image IDs that belong to specific variants (like Matte Black, Navy Blue)
    const allVariantMediaIds = variants
      .map((v) => v.featured_media_id)
      .filter((id) => id !== null);

    formInputs.forEach((input) => {
      input.addEventListener("change", () => {
        const selectedOptions = [];
        optionsContainer
          .querySelectorAll(".variant-options")
          .forEach((group) => {
            const checked = group.querySelector("input:checked");
            selectedOptions.push(checked ? checked.value : null);
          });

        const matchedVariant = variants.find((variant) => {
          return (
            variant.option1 === selectedOptions[0] &&
            variant.option2 === (selectedOptions[1] || null) &&
            variant.option3 === (selectedOptions[2] || null)
          );
        });

        if (matchedVariant) {
          // Update Form Data
          if (hiddenInput) hiddenInput.value = matchedVariant.id;
          if (priceDisplay) priceDisplay.innerHTML = matchedVariant.price;
          window.history.replaceState({}, "", "?variant=" + matchedVariant.id);

          // --- 4. FILTER SWIPER IMAGES ---
          const currentMediaId = matchedVariant.featured_media_id;

          if (currentMediaId) {
            // Keep the slide IF it matches the selected color, OR if it's a general image not tied to any color
            const filterLogic = (slideObj) =>
              slideObj.id === currentMediaId ||
              !allVariantMediaIds.includes(slideObj.id);

            const newThumbsHTML = originalThumbs
              .filter(filterLogic)
              .map((s) => s.html);
            const newMainsHTML = originalMains
              .filter(filterLogic)
              .map((s) => s.html);

            // Rebuild Swiper with only the filtered images
            thumbsSwiper.removeAllSlides();
            thumbsSwiper.appendSlide(newThumbsHTML);

            mainSwiper.removeAllSlides();
            mainSwiper.appendSlide(newMainsHTML);

            mainSwiper.slideTo(0);
          }
        }
      });
    });
  }
});
