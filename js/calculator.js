document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("#cost-calculator");
  const areaInput = document.querySelector("#area");
  const costOutput = document.querySelector("#cost-value");
  const rateStatus = document.querySelector("[data-rate-status]");

  if (!form || !areaInput || !costOutput) {
    return;
  }

  const fallbackRates = {
    USD: 1,
    EUR: 0.92,
    UAH: 41.5
  };
  const currencyConfig = {
    USD: { symbol: "$", locale: "en-US", suffix: false },
    EUR: { symbol: "€", locale: "en-US", suffix: false },
    UAH: { symbol: "₴", locale: "uk-UA", suffix: true }
  };
  const rates = Object.assign({}, fallbackRates);
  const usdToUahFormatter = new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const integerFormatters = {
    USD: new Intl.NumberFormat("en-US"),
    EUR: new Intl.NumberFormat("en-US"),
    UAH: new Intl.NumberFormat("uk-UA")
  };

  function getSelectedCurrency() {
    const selectedCurrency = form.querySelector('input[name="currency"]:checked');
    return selectedCurrency ? selectedCurrency.value : "USD";
  }

  function formatAmount(amount, currency) {
    const config = currencyConfig[currency];
    const formattedAmount = integerFormatters[currency].format(amount);
    return config.suffix
      ? formattedAmount + " " + config.symbol
      : config.symbol + formattedAmount;
  }

  function calculateCost() {
    const area = Number.parseFloat(areaInput.value);
    const selectedType = form.querySelector('input[name="object-type"]:checked');
    const baseRate = selectedType ? Number.parseFloat(selectedType.dataset.rate) : 40;
    const extras = Array.from(form.querySelectorAll('input[name="service[]"]:checked'))
      .reduce(function (total, checkbox) {
        return total + (Number.parseFloat(checkbox.dataset.multiplier) || 0);
      }, 0);
    const currency = getSelectedCurrency();

    if (!Number.isFinite(area) || area <= 0) {
      costOutput.textContent = formatAmount(0, currency);
      return;
    }

    const minimumUsd = Math.round(area * baseRate * (1 + extras));
    const maximumUsd = Math.round(minimumUsd * 1.2);
    const minimum = Math.round(minimumUsd * rates[currency]);
    const maximum = Math.round(maximumUsd * rates[currency]);
    costOutput.textContent = formatAmount(minimum, currency) + " – " + formatAmount(maximum, currency);
  }

  function updateRateInformer(usdToUah, eurToUah, status) {
    const usdRate = document.querySelector('[data-rate-display="USD"]');
    const eurRate = document.querySelector('[data-rate-display="EUR"]');

    if (usdRate) {
      usdRate.textContent = usdToUahFormatter.format(usdToUah) + " ₴";
    }
    if (eurRate) {
      eurRate.textContent = usdToUahFormatter.format(eurToUah) + " ₴";
    }
    if (rateStatus) {
      rateStatus.textContent = status;
    }
  }

  async function loadExchangeRates() {
    const endpoint = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json";

    try {
      const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
      if (!response.ok) {
        throw new Error("NBU exchange-rate request failed: " + response.status);
      }

      const exchangeRates = await response.json();
      const usdEntry = exchangeRates.find(function (entry) { return entry.cc === "USD"; });
      const eurEntry = exchangeRates.find(function (entry) { return entry.cc === "EUR"; });

      if (!usdEntry || !eurEntry || !Number.isFinite(usdEntry.rate) || !Number.isFinite(eurEntry.rate)) {
        throw new Error("NBU exchange-rate response is incomplete");
      }

      rates.UAH = usdEntry.rate;
      rates.EUR = eurEntry.rate / usdEntry.rate;
      updateRateInformer(
        usdEntry.rate,
        eurEntry.rate,
        "Курс НБУ, дата: " + (usdEntry.exchangedate || "сьогодні")
      );
      calculateCost();
    } catch (error) {
      updateRateInformer(
        fallbackRates.UAH,
        fallbackRates.UAH / fallbackRates.EUR,
        "Орієнтовний fallback-курс, НБУ недоступний"
      );
      console.warn("Не вдалося завантажити курс НБУ. Використано fallback-значення.", error);
    }
  }

  form.addEventListener("input", calculateCost);
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    calculateCost();
  });

  updateRateInformer(
    fallbackRates.UAH,
    fallbackRates.UAH / fallbackRates.EUR,
    "Fallback-курс до оновлення даних НБУ"
  );
  calculateCost();
  loadExchangeRates();
});
