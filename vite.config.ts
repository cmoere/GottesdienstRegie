import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({mode})=>({
  plugins:[react()],
  base:mode==='web'?'/' : './',
  define:{__APP_TARGET__:JSON.stringify(mode==='web'?'web':'desktop')}
}));
