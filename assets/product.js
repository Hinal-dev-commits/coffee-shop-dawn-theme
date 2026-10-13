document.addEventListener("DOMContentLoaded", function () {
  const galleryEl = document.querySelector(".gallery");
  const thumbsEl = document.querySelector(".thumbs-swiper");
  const mainEl = document.querySelector(".main-swiper");

  if (!thumbsEl || !mainEl || typeof Swiper === "undefined") return;

  // --- 1. STORE ORIGINAL SLIDES (before Swiper touches the DOM) ---
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
  const thumbsSwiper = new Swiper(thumbsEl, {
    slidesPerView: "auto",
    spaceBetween: 12,
    freeMode: true,
    watchSlidesProgress: true,
    direction: "horizontal",
    breakpoints: { 701: { direction: "vertical" } },
  });

  const mainSwiper = new Swiper(mainEl, {
    spaceBetween: 10,
    navigation: {
      nextEl: document.querySelector(".swiper-button-next"),
      prevEl: document.querySelector(".swiper-button-prev"),
    },
    thumbs: { swiper: thumbsSwiper },
  });

  // --- 3. VARIANT LOGIC ---
  const optionsContainer = document.getElementById("product-options");
  const variantJsonScript = document.getElementById("product-variants-json");

  if (!optionsContainer || !variantJsonScript) {
    galleryEl && galleryEl.classList.add("is-ready");
    return;
  }

  const variants = JSON.parse(variantJsonScript.textContent);
  const hiddenInput = document.querySelector('input[name="id"]');
  const priceDisplay = document.querySelector(".price");
  const formInputs = optionsContainer.querySelectorAll('input[type="radio"]');

  const allVariantMediaIds = variants
    .map((v) => v.featured_media_id)
    .filter((id) => id !== null);

  function getMatchedVariant() {
    const selectedOptions = [];
    optionsContainer.querySelectorAll(".variant-options").forEach((group) => {
      const checked = group.querySelector("input:checked");
      selectedOptions.push(checked ? checked.value : null);
    });

    return variants.find(
      (variant) =>
        variant.option1 === selectedOptions[0] &&
        variant.option2 === (selectedOptions[1] || null) &&
        variant.option3 === (selectedOptions[2] || null),
    );
  }

  function filterGallery(variant) {
    const currentMediaId = variant.featured_media_id;
    if (!currentMediaId) return;

    // Keep the slide if it is the selected variant's image,
    // or a general image not tied to any variant
    const filterLogic = (slideObj) =>
      slideObj.id === currentMediaId ||
      !allVariantMediaIds.includes(slideObj.id);

    thumbsSwiper.removeAllSlides();
    thumbsSwiper.appendSlide(originalThumbs.filter(filterLogic).map((s) => s.html));

    mainSwiper.removeAllSlides();
    mainSwiper.appendSlide(originalMains.filter(filterLogic).map((s) => s.html));

    thumbsSwiper.update();
    mainSwiper.update();
    mainSwiper.slideTo(0);
  }

  function applyVariant(variant, updateUrl) {
    if (hiddenInput) hiddenInput.value = variant.id;
    if (priceDisplay) priceDisplay.innerHTML = variant.price;
    if (updateUrl) {
      window.history.replaceState({}, "", "?variant=" + variant.id);
    }
    filterGallery(variant);
  }

  // --- 4. RUN ON PAGE LOAD (this was missing) ---
  const initialVariant = getMatchedVariant();
  if (initialVariant) applyVariant(initialVariant, false);

  // --- 5. RUN ON VARIANT CHANGE ---
  formInputs.forEach((input) => {
    input.addEventListener("change", () => {
      const matchedVariant = getMatchedVariant();
      if (matchedVariant) applyVariant(matchedVariant, true);
    });
  });

  galleryEl && galleryEl.classList.add("is-ready");
});