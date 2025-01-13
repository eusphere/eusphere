const root = document.getElementById("root");

fetch("/static/concept.json")
  .then((response) => response.json())
  .then((data) => {
    root.appendChild(mkCarousel(data, 25));
    root.appendChild(mkCarousel(data, 15));
  });

function mkCarousel(data, speed) {
  const carousel = document.createElement("div");
  const paths = [...data.images].sort(() => Math.random() - 0.5);
  const animationStyle = `slide ${speed}s linear infinite`;
  // build the carousel
  carousel.classList.add("carousel");
  carousel.innerHTML = paths
    .map((p) => `<img src="/static/concept/${p}" style="animation: ${animationStyle}">`)
    .join("");
  return carousel;
}
