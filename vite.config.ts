import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function manageMerchantAccessDevApi(): Plugin {
  return {
    name: 'manage-merchant-access-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const requestUrl = req.url ? new URL(req.url, 'http://127.0.0.1') : null;
        if (!requestUrl || requestUrl.pathname !== '/api/manage-merchant-access') {
          next();
          return;
        }

        try {
          const method = (req.method ?? 'GET').toUpperCase();
          const requestHeaders = new Headers();

          Object.entries(req.headers).forEach(([headerName, headerValue]) => {
            if (Array.isArray(headerValue)) {
              headerValue.forEach((value) => requestHeaders.append(headerName, value));
              return;
            }

            if (typeof headerValue === 'string') {
              requestHeaders.set(headerName, headerValue);
            }
          });

          const requestBody =
            method === 'GET' || method === 'HEAD'
              ? undefined
              : await new Promise<Buffer>((resolve, reject) => {
                  const chunks: Buffer[] = [];
                  req.on('data', (chunk) => {
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                  });
                  req.on('end', () => resolve(Buffer.concat(chunks)));
                  req.on('error', reject);
                });

          const request = new Request(requestUrl.toString(), {
            method,
            headers: requestHeaders,
            body: requestBody && requestBody.length > 0 ? requestBody : undefined,
          });

          const { default: handler } = await server.ssrLoadModule('/api/manage-merchant-access.ts');
          const response = await handler(request);

          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });

          const responseBody = Buffer.from(await response.arrayBuffer());
          res.end(responseBody);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Internal Server Error';
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const loadedEnv = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, loadedEnv);

  const publicSupabaseUrl = loadedEnv.VITE_SUPABASE_URL || loadedEnv.SUPABASE_URL || '';
  const publicSupabaseAnonKey = loadedEnv.VITE_SUPABASE_ANON_KEY || loadedEnv.SUPABASE_ANON_KEY || '';

  return {
    plugins: [react(), manageMerchantAccessDevApi()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(publicSupabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(publicSupabaseAnonKey),
    },
  };
});
