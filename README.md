# CryOutNow - Share Your Prayer Requests

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

## Environment Variables

This project uses environment variables for configuration. To set up your local environment:

1. Copy the `.env.example` file to a new file named `.env`:

```bash
cp .env.example .env
```

2. Edit the `.env` file and fill in the required values:

```
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_PROJECT_ID=your_supabase_project_id

# Application Configuration
VITE_BASE_PATH=/
VITE_TEMPO=false
```

### Required Environment Variables

- **VITE_SUPABASE_URL**: Your Supabase project URL
- **VITE_SUPABASE_ANON_KEY**: Your Supabase anonymous key
- **SUPABASE_PROJECT_ID**: Your Supabase project ID (used for type generation)
- **VITE_BASE_PATH**: Base path for the application (default: "/")
- **VITE_TEMPO**: Enable/disable Tempo features ("true" or "false")

### Using Environment Variables in the Code

In Vite, you can access environment variables in your code using `import.meta.env`:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
```

Note: Only variables prefixed with `VITE_` are exposed to your client-side code.
