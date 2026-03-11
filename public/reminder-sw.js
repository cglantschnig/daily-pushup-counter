self.addEventListener("periodicsync", (event) => {
  if (event.tag !== "pushup-reminder") {
    return
  }

  event.waitUntil(
    self.registration.showNotification("Pushup check-in", {
      body: "Time for another quick pushup set.",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "pushup-reminder",
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          return client.focus()
        }
      }

      if ("openWindow" in self.clients) {
        return self.clients.openWindow("/")
      }

      return undefined
    })
  )
})
