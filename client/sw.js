self.addEventListener("push", function(event) {
  const data = event.data ? event.data.json() : {};

  self.registration.showNotification(data.title || "Buzzi Messenger", {
    self.addEventListener("fetch", () => {});
    body: data.body || "Nieuw bericht",
    icon: "/icon.png",
    badge: "/icon.png"
  });
});