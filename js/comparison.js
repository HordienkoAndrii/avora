(function () {
  "use strict";

  const widget = document.querySelector("[data-comparison]");
  const range = document.querySelector("#comparison-position");

  if (!widget || !range) {
    return;
  }

  const beforePanel = widget.querySelector(".comparison-before");
  const divider = widget.querySelector(".comparison-divider");

  if (!beforePanel || !divider) {
    return;
  }

  function setPositionFromPointer(event) {
    const bounds = widget.getBoundingClientRect();
    const position = ((event.clientX - bounds.left) / bounds.width) * 100;
    range.value = String(Math.min(100, Math.max(0, position)));
    updateComparison(range.value);
  }

  function updateComparison(value) {
    const position = Math.min(100, Math.max(0, Number(value)));
    widget.style.setProperty("--comparison-position", position + "%");
    range.setAttribute("aria-valuenow", position);
    range.setAttribute("aria-valuetext", position + "%");
  }

  range.addEventListener("input", function () {
    updateComparison(range.value);
  });

  range.addEventListener("pointerdown", function (event) {
    range.setPointerCapture(event.pointerId);
    setPositionFromPointer(event);
  });

  range.addEventListener("pointermove", function (event) {
    if (range.hasPointerCapture(event.pointerId)) {
      setPositionFromPointer(event);
    }
  });

  range.addEventListener("pointerup", function (event) {
    if (range.hasPointerCapture(event.pointerId)) {
      range.releasePointerCapture(event.pointerId);
    }
  });

  updateComparison(range.value);
}());
