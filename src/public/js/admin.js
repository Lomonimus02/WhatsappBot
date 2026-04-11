// Admin panel client-side JS
document.addEventListener('DOMContentLoaded', () => {
  // Auto-refresh WhatsApp status on the status page
  if (window.location.pathname === '/admin/whatsapp') {
    setInterval(async () => {
      try {
        const res = await fetch('/admin/api/whatsapp-status');
        const data = await res.json();
        if (data.isReady) {
          window.location.reload();
        }
      } catch (e) {
        // ignore
      }
    }, 5000);
  }
});
