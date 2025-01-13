const root = document.getElementById("root");

fetch("/static/concept.json")
  .then((response) => response.json())
  .then((data) => {
    root.appendChild(mkCarousel(data));
    root.appendChild(mkCarousel(data));
    // root.appendChild(mkBanner());
    root.appendChild(mkCarousel(data));
  });

function mkCarousel(data) {
  const carousel = document.createElement("div");
  const paths = [...data.images].sort(() => Math.random() - 0.5);
  const speed = 10 * Math.random();
  const animationStyle = `slide ${speed}s linear infinite`;
  // build the carousel
  carousel.classList.add("carousel");
  carousel.innerHTML = paths
    .map((p) => `<img src="/static/concept/${p}" style="animation: ${animationStyle}">`)
    .join("");
  return carousel;
}

function mkBanner() {
  const banner = document.createElement("div");
  banner.classList.add("banner");
  banner.innerHTML = "Monarchy";
  return banner;
}
