(() => {
  const BYTES_PER_FLOAT32 = 4;
  const BYTES_PER_GIB = 1024 ** 3;
  const VECTOR_STOPS = [10000, 100000, 1000000, 10000000];
  const MEMORY_PROFILES = {
    lean: 15,
    balanced: 30,
    heavy: 50,
  };
  const STORAGE_PROFILES = {
    vector_heavy: 2,
    typical: 3,
    metadata_heavy: 4,
  };

  const parsePositive = (value, fallback) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return parsed;
  };

  const formatGiB = (value) => `${value.toFixed(2)} GiB`;

  const initResourceCalculator = (root) => {
    const scope =
      root && typeof root.querySelectorAll === "function" ? root : document;
    const calculators = scope.querySelectorAll("[data-resource-calculator]");

    calculators.forEach((calculator) => {
      if (!(calculator instanceof HTMLElement)) {
        return;
      }
      if (calculator.dataset.initialized === "true") {
        return;
      }
      calculator.dataset.initialized = "true";

      const vectorStopInput = calculator.querySelector(
        '[data-input="vector_stop"]'
      );
      const modelDimensionInput = calculator.querySelector(
        '[data-input="model_dimension"]'
      );
      const memoryProfileInput = calculator.querySelector(
        '[data-input="memory_profile"]'
      );
      const storageProfileInput = calculator.querySelector(
        '[data-input="storage_profile"]'
      );

      const vectorCountOutput = calculator.querySelector(
        '[data-output="vector_count"]'
      );
      const payloadOutput = calculator.querySelector(
        '[data-output="payload_gib"]'
      );
      const ramOutput = calculator.querySelector('[data-output="ram_gib"]');
      const diskOutput = calculator.querySelector('[data-output="disk_gib"]');
      const vcpuOutput = calculator.querySelector('[data-output="vcpu_hint"]');

      if (
        !(vectorStopInput instanceof HTMLInputElement) ||
        !(modelDimensionInput instanceof HTMLSelectElement) ||
        !(memoryProfileInput instanceof HTMLSelectElement) ||
        !(storageProfileInput instanceof HTMLSelectElement) ||
        !(vectorCountOutput instanceof HTMLElement) ||
        !(payloadOutput instanceof HTMLElement) ||
        !(ramOutput instanceof HTMLElement) ||
        !(diskOutput instanceof HTMLElement) ||
        !(vcpuOutput instanceof HTMLElement)
      ) {
        return;
      }

      const recalculate = () => {
        const stopIndex = Math.min(
          VECTOR_STOPS.length - 1,
          Math.max(0, Math.round(Number(vectorStopInput.value) || 0))
        );
        const vectors = VECTOR_STOPS[stopIndex];
        const dimensions = parsePositive(modelDimensionInput.value, 1);
        const headroom =
          MEMORY_PROFILES[memoryProfileInput.value] ?? MEMORY_PROFILES.balanced;
        const diskMultiplier =
          STORAGE_PROFILES[storageProfileInput.value] ??
          STORAGE_PROFILES.typical;

        const payloadBytes = vectors * dimensions * BYTES_PER_FLOAT32;
        const payloadGiB = payloadBytes / BYTES_PER_GIB;
        const estimatedRamGiB = payloadGiB * (1 + headroom / 100);
        const estimatedDiskGiB = payloadGiB * diskMultiplier;
        const vcpuHint = Math.max(1, Math.ceil(estimatedRamGiB / 4));

        vectorCountOutput.textContent = vectors.toLocaleString("en-US");
        payloadOutput.textContent = formatGiB(payloadGiB);
        ramOutput.textContent = formatGiB(estimatedRamGiB);
        diskOutput.textContent = formatGiB(estimatedDiskGiB);
        vcpuOutput.textContent = `${vcpuHint} vCPU`;
      };

      [
        vectorStopInput,
        modelDimensionInput,
        memoryProfileInput,
        storageProfileInput,
      ].forEach((input) => {
        input.addEventListener("input", recalculate);
        input.addEventListener("change", recalculate);
      });

      recalculate();
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    initResourceCalculator(document);
  });

  if (typeof document$ !== "undefined" && document$) {
    document$.subscribe((root) => {
      initResourceCalculator(root);
    });
  }
})();
