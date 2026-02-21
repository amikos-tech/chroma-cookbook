(() => {
  if (typeof document$ === "undefined") {
    return;
  }

  const DESKTOP_SIDEBAR_MEDIA = "(min-width: 60em)";
  const CONTAINER_SELECTOR = ".mdx-ethicalads-container";

  const syncAdPlacement = () => {
    const containers = Array.from(document.querySelectorAll(CONTAINER_SELECTOR));
    if (containers.length === 0) {
      return;
    }

    // Keep a single ad container across instant navigation updates.
    const [container, ...duplicates] = containers;
    duplicates.forEach((node) => node.remove());

    const onDesktop = window.matchMedia(DESKTOP_SIDEBAR_MEDIA).matches;
    const secondary = document.querySelector(".md-sidebar--secondary .md-sidebar__inner");
    const primary = document.querySelector(".md-sidebar--primary .md-sidebar__inner");
    const sidebarTarget = secondary || primary;

    if (onDesktop && sidebarTarget) {
      if (container.parentElement !== sidebarTarget || sidebarTarget.firstElementChild !== container) {
        sidebarTarget.prepend(container);
      }
      container.setAttribute("data-placement", "sidebar");
      return;
    }

    if (container.parentElement !== document.body) {
      document.body.appendChild(container);
    }
    container.setAttribute("data-placement", "floating");
  };

  let firstRender = true;
  window.addEventListener("resize", syncAdPlacement, { passive: true });

  document$.subscribe(() => {
    syncAdPlacement();

    if (firstRender) {
      firstRender = false;
      return;
    }

    if (window.ethicalads && typeof window.ethicalads.reload === "function") {
      window.ethicalads.reload();
    }
  });
})();
