console.log("product.js loaded");
document.addEventListener("DOMContentLoaded", function () {
  if (typeof Swiper === "undefined") return;

  document.querySelectorAll(".gallery").forEach(function (root) {
    var thumbsEl = root.querySelector(".thumbs-swiper");
    var mainEl = root.querySelector(".main-swiper");
    if (!thumbsEl || !mainEl) return;

    var thumbs = new Swiper(thumbsEl, {
      slidesPerView: "auto",
      spaceBetween: 12,
      freeMode: true,
      watchSlidesProgress: true,
      direction: "horizontal",
      breakpoints: {
        701: { direction: "vertical" },
      },
    });

    new Swiper(mainEl, {
      spaceBetween: 10,
      navigation: {
        nextEl: root.querySelector(".swiper-button-next"),
        prevEl: root.querySelector(".swiper-button-prev"),
      },
      thumbs: { swiper: thumbs },
    });
  });
});
