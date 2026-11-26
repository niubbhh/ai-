Netlify AI assistant deployment package

IMPORTANT: Netlify Drop static ZIP upload may not deploy serverless functions. For reliable full deployment, put the extracted project into a GitHub repository and use Netlify > Add new project > Import an existing project. Use the existing site if linking its repository, to retain the current URL.

1. Set AGNES_API_KEY as a Netlify environment variable for Functions; use a NEW key, not the previously exposed key.
2. Deploy the entire source project using Git integration (not only the public folder).
3. Check GET / (should say OK), GET /aligenie/926d19e70f74c20f796d376aafa3c6e2.txt (verification string), GET /.netlify/functions/chat (OK).
4. Test POST / with JSON {"text":"你好"} and check response. Do not publish until real AliGenie request and response formats are confirmed.
5. Keep the existing skill URL unchanged. Do not overwrite your currently working Netlify site with a static-only deployment.

This is a prototype. The response format follows your earlier Worker implementation and may need adjustment for your exact AliGenie protocol.

