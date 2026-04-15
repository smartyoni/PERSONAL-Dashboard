// Service Worker for Web Share Target API
// Handles shared content from mobile/system sharing

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installed');
  self.skipWaiting();
});

// Activate event - clear old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Clearing old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[SW] Caches cleared, claiming clients...');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle share-target POST requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle share-target endpoint
  if (url.pathname.endsWith('/share-target') && event.request.method === 'POST') {
    event.respondWith(handleShareTarget(event.request));
  }
});

// Handle share target POST request
async function handleShareTarget(request) {
  try {
    const formData = await request.formData();

    // Extract shared data from form data
    const title = formData.get('title') || '';
    const text = formData.get('text') || '';
    const url = formData.get('url') || '';

    // Combine all data into a single text (joined by newline)
    const sharedParts = [title, text, url].filter(part => part.trim());
    const sharedText = sharedParts.join('\n');

    // Create redirect URL with shared data as query parameters
    const params = new URLSearchParams({
      shared: 'true',
      text: sharedText
    });

    // Use absolute base path to support GitHub Pages
    const redirectUrl = `/PERSONAL-Dashboard/?${params.toString()}`;

    // Redirect to main page with shared data (303 See Other for POST to GET conversion)
    return Response.redirect(redirectUrl, 303);
  } catch (error) {
    console.error('[SW] Error handling share target:', error);
    // Fallback redirect to main page
    return Response.redirect('/PERSONAL-Dashboard/', 303);
  }
}
