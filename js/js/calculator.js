document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("#cost-calculator");
  const areaInput = document.querySelector("#area");
  const costOutput = document.querySelector("#cost-value");

  if (!form || !areaInput || !costOutput) {
    return;
  }

  const formatter = new Intl.NumberFormat("en-US");

  function calculateCost() {
    const area = Number.parseFloat(areaInput.value);
    const selectedType = form.querySelector('input[name="object-type"]:checked');
    const baseRate = selectedType ? Number.parseFloat(selectedType.dataset.rate) : 40;
    const extras = Array.from(form.querySelectorAll('input[name="service[]"]:checked'))
      .reduce(function (total, checkbox) {
        return total + (Number.parseFloat(checkbox.dataset.multiplier) || 0);
      }, 0);

    if (!Number.isFinite(area) || area <= 0) {
      costOutput.textContent = "$0";
      return;
    }

    const minimum = Math.round(area * baseRate * (1 + extras));
    const maximum = Math.round(minimum * 1.2);
    costOutput.textContent = "$" + formatter.format(minimum) + " – $" + formatter.format(maximum);
  }

  form.addEventListener("input", calculateCost);
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    calculateCost();
  });

  calculateCost();
});
