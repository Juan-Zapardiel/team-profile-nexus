import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  console.log('Vite Config - Environment Variables:', env);
  // Debug logging
  console.log('Vite Config - Environment Variables:', {
    mode,
    harvestToken: env.VITE_HARVEST_ACCESS_TOKEN ? 'Present' : 'Missing',
    harvestAccountId: env.VITE_HARVEST_ACCOUNT_ID ? 'Present' : 'Missing',
    supabaseUrl: env.VITE_SUPABASE_URL ? 'Present' : 'Missing',
    supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
    envKeys: Object.keys(env).filter(key => key.startsWith('VITE_'))
  });

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Expose env variables to your app
    define: {
      'import.meta.env.VITE_HARVEST_ACCESS_TOKEN': JSON.stringify(env.VITE_HARVEST_ACCESS_TOKEN),
      'import.meta.env.VITE_HARVEST_ACCOUNT_ID': JSON.stringify(env.VITE_HARVEST_ACCOUNT_ID),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
  };
});
