const SERVICE_WORKER_FILE = "sw.js";

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    const serviceWorkerUrl = new URL(SERVICE_WORKER_FILE, window.location.href);

    navigator.serviceWorker
      .register(serviceWorkerUrl, { scope: "./" })
      .then((registration) => {
        registration.update();
      })
      .catch((error) => {
        console.warn("离线缓存注册失败", error);
      });
  });
}

