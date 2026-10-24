import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import postcssNesting from 'postcss-nesting';

var MainHtmlPath = "index.html"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // npm run dev 時把 /api 轉到伺服器；位址放在 .env.development 的 API_PROXY_TARGET（.env.local 可覆寫；非 VITE_ 開頭，不會打包進網頁）
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.API_PROXY_TARGET

  return {
    plugins: [vue()],
    server: apiProxyTarget ? {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    } : undefined,
    build: {
      rollupOptions: {
        input: {
          // a: "./" + MainHtmlPath,
          indexPath: "index.html",
        },

        output: {
          assetFileNames: (assetInfo) => {
            let extType = assetInfo.name.split('.').at(1);
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              extType = 'img';
            }
            return `static/[name]/${extType}/[name]-[hash][extname]`;
          },
          chunkFileNames: 'static/[name]/js/[name]-[hash].js',
          entryFileNames: 'static/[name]/js/[name]-[hash].js',
        },
      },
    },
    css: {
      postcss: {
        plugins: [
          postcssNesting
        ],
      },
    },
    // root: 'src',
    // server: {
    //   open: MainHtmlPath
    // }
  }
})
