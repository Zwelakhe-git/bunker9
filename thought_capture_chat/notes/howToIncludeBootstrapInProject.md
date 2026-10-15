## install BS
```shell
npm i bootstrap@6.0.0-alpha.1
```

## import modules
### scss (for customisation)
```shell
npm i sass --save-dev
```

```scss
// src/scss/custom-bootstrap.scss
@import "bootstrap/scss/functions";

// custom vars and rules

@import "bootstrap/scss/bootstrap";
```
```tsx
// src/main.tsx
import "./scss/custom-bootstrap.scss";

```

### already compiled css
```tsx
// src/main.tsx
import "bootstrap/dist/css/bootstrap.min.css";

// js
import "bootstrap/dist/js/bootstrap.bundle.min.js";
```