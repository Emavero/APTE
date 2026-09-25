import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' },
      ],
      // Un contexte est colocalisé avec son fournisseur et son hook : c'est
      // plus lisible qu'un fichier par symbole, et cela ne coûte qu'un
      // rafraîchissement complet de ces deux fichiers en développement.
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ['AuthContext', 'CartContext', 'useAuth', 'useCart'] },
      ],
    },
  },
])
