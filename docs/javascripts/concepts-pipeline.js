document.addEventListener("DOMContentLoaded", () => {
  const pipelines = document.querySelectorAll("[data-concept-pipeline]");

  pipelines.forEach((pipeline) => {
    const nodes = Array.from(pipeline.querySelectorAll("[data-stage]"));
    const edges = Array.from(pipeline.querySelectorAll("[data-edge]"));
    const detailTitle = pipeline.querySelector("[data-pipeline-detail-title]");
    const detailService = pipeline.querySelector("[data-pipeline-detail-service]");
    const detailText = pipeline.querySelector("[data-pipeline-detail-text]");

    if (!nodes.length || !detailTitle || !detailService || !detailText) {
      return;
    }

    const clearState = () => {
      nodes.forEach((node) => {
        node.classList.remove("is-active", "is-related");
      });
      edges.forEach((edge) => {
        edge.classList.remove("is-related");
      });
    };

    const setActive = (node) => {
      clearState();
      node.classList.add("is-active");

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
    } else {
      setActive(nodes[0]);
    }
  });
});
