```shell
npm install --save-dev vite-plugin-svgr
```

```ts
// vite.config.ts
import defineConfig from 'vite';
import react from '@vite/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
    plugins: [
        react(),
        svgr(),
    ]
})
```

```json
// tsconfig.json

{
    "compilerOptions": {
        "types": ["vite-plugin-svgr/client"]
    }
}
```

```tsx
// app.tsx
import Icon from "./assets/my-icon.svg?react";

<Icon />
```