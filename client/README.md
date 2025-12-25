# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

---

### Change Log

#### 2025-12-25: Fixed IsometricEditor drag positioning
- **File modified**: `client/src/components/IsometricEditor.jsx`
- **Issue**: When dragging 3D objects in the isometric grid, the object would appear NEXT TO the green preview square instead of ON it.
- **Fix**: Updated `DraggableAsset` component to use the snapped grid position (same as the green highlight) when dragging, instead of the original position plus mouse offset. The object now follows the green preview tile as you drag, giving accurate visual feedback of where the asset will be placed.

#### 2025-12-25: Made drag preview + drop deterministic
- **File modified**: `client/src/components/IsometricEditor.jsx`
- **Issue**: The green preview tile could show one location while the dragged object / final drop landed elsewhere.
- **Fix**: Compute snapped `{gridX, gridY}` during mousemove, store it in `dragging`, and reuse it for green preview rendering, dragged asset rendering, and final mouse-up save.

#### 2025-12-25: Fixed ID mismatch and snap offset in IsometricEditor
- **File modified**: `client/src/components/IsometricEditor.jsx`
- **Issue**: Identity comparison `===` was failing for IDs of mixed types (string vs number), causing the asset to stay at its old position during drag. Also, snapping was based on the cursor rather than the asset's base.
- **Fix**: Implemented robust stringified ID comparison (`String(id)`) and added a "grab offset" calculation so the asset base snaps exactly to the green tile regardless of where you clicked on the model.

#### 2025-12-25: Added grab/grabbing cursor feedback
- **File modified**: `client/src/components/IsometricEditor.jsx`
- **Issue**: No visual feedback when catching/grabbing an object.
- **Fix**: Added `cursor: grab` on hover and `cursor: grabbing` while dragging to the `DraggableAsset` component.

#### 2025-12-25: Fixed drag to follow mouse smoothly
- **File modified**: `client/src/components/IsometricEditor.jsx`
- **Issue**: Objects were "jumping" to snap to grid positions during drag instead of following the mouse cursor smoothly.
- **Fix**: Changed drag behavior so objects follow the mouse cursor smoothly by adding the drag offset to the original position, while the snapped position is only applied on mouse-up (drop).
