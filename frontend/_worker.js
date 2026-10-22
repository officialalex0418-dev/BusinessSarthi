export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const path = url.pathname;

    // If requesting static assets (JS, CSS, images, etc.), serve directly
    if (path.includes('.') && !path.endsWith('.html')) {
      return env.ASSETS.fetch(request);
    }

    // Determine target HTML based on subdomain
    let targetHtml = '/index.html'; // app.bussinesssarthi.com
    if (hostname.startsWith('admin.')) {
      targetHtml = '/admin.html';
    } else if (hostname.startsWith('company.')) {
      targetHtml = '/company.html';
    } else if (hostname.startsWith('stockist.')) {
      targetHtml = '/stockist.html';
    }

    const targetUrl = new URL(targetHtml, request.url);
    return env.ASSETS.fetch(new Request(targetUrl, request));
  }
};
