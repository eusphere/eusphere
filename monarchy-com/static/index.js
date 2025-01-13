const root = document.getElementById("root");

fetch("/static/concept.json")
  .then((response) => response.json())
  .then((data) => {
    const splits = shuffleSplit(data, 2);
    root.appendChild(mkCarousel(splits[0], 25));
    root.appendChild(mkCarousel(splits[1], 15));
  });

function mkCarousel(images, speed) {
  const carousel = document.createElement("div");
  const animationStyle = `slide ${speed}s linear infinite`;
  // build the carousel
  carousel.classList.add("carousel");
  carousel.innerHTML = images
    .map((p) => `<img src="/static/concept/${p}" style="animation: ${animationStyle}">`)
    .join("");
  return carousel;
}

function shuffleSplit(data, count) {
  const images = [...data.images].sort(() => Math.random() - 0.5);
  const splits = [];
  for (let i = 0; i < count; i++) {
    const splitSize = Math.floor(images.length / (count - i));
    splits.push(images.splice(0, splitSize));
  }
  return splits;
}
