(() => {
  const initConceptPipelines = (root) => {
    const scope =
      root && typeof root.querySelectorAll === "function" ? root : document;
    const pipelines = scope.querySelectorAll("[data-concept-pipeline]");

    pipelines.forEach((pipeline) => {
      if (!(pipeline instanceof HTMLElement)) {
        return;
      }

      const nodes = Array.from(pipeline.querySelectorAll("[data-stage]"));
      const edges = Array.from(pipeline.querySelectorAll("[data-edge]"));
      const detailTitle = pipeline.querySelector("[data-pipeline-detail-title]");
      const detailService = pipeline.querySelector(
        "[data-pipeline-detail-service]"
      );
      const detailText = pipeline.querySelector("[data-pipeline-detail-text]");

      if (!nodes.length || !detailTitle || !detailService || !detailText) {
        return;
      }

      if (pipeline.dataset.pipelineInitialized === "true") {
        return;
      }
      pipeline.dataset.pipelineInitialized = "true";

      const clearState = () => {
        nodes.forEach((node) => {
          node.classList.remove("is-active", "is-related");
          node.setAttribute("aria-pressed", "false");
        });
        edges.forEach((edge) => {
          edge.classList.remove("is-related");
        });
      };

      const setActive = (node) => {
        clearState();
        node.classList.add("is-active");
        node.setAttribute("aria-pressed", "true");

        const title = node.getAttribute("data-title") || node.textContent || "";
        const service = node.getAttribute("data-service") || "";
        const description = node.getAttribute("data-description") || "";
        detailTitle.textContent = title.trim();
        detailService.textContent = service.trim();
        detailText.textContent = description.trim();

        const relatedRaw = node.getAttribute("data-related") || "";
        const relatedIds = relatedRaw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        relatedIds.forEach((id) => {
          const relatedNode = pipeline.querySelector(`[data-stage="${id}"]`);
          if (relatedNode) {
            relatedNode.classList.add("is-related");
          }
          const relatedEdge = pipeline.querySelector(`[data-edge="${id}"]`);
          if (relatedEdge) {
            relatedEdge.classList.add("is-related");
          }
        });
      };

      pipeline.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        const node = target.closest("[data-stage]");
        if (!(node instanceof HTMLElement)) {
          return;
        }
        setActive(node);
      });

      const initial = pipeline.querySelector("[data-stage].is-active");
      if (initial instanceof HTMLElement) {
        setActive(initial);
      } else if (nodes[0] instanceof HTMLElement) {
        setActive(nodes[0]);
      }
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    initConceptPipelines(document);
  });

  if (typeof document$ !== "undefined" && document$) {
    document$.subscribe((root) => {
      initConceptPipelines(root);
    });
  }
})();
