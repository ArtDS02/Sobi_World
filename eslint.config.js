import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

const coreRestrictedSyntax = [
  {
    selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
    message: 'src/core is pure: inject `now` instead of calling Date.now().',
  },
  {
    selector: "NewExpression[callee.name='Date'][arguments.length=0]",
    message: 'src/core is pure: inject `now` instead of new Date().',
  },
];
const coreRestrictedGlobals = [
  'window',
  'document',
  'localStorage',
  'indexedDB',
  'navigator',
  'fetch',
].map((name) => ({
  name,
  message: `src/core is pure: ${name} belongs in src/platform (or ui/store/game).`,
}));
const mathRandom = {
  selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
  message: 'src/core is pure: inject `rng` instead of Math.random().',
};

export default tseslint.config(
  { ignores: ['dist', 'dist-electron', 'release', 'coverage', 'node_modules', '.claude'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // Hooks for later phases keep their final signature with _-prefixed unused params.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...coreRestrictedSyntax, mathRandom],
      'no-restricted-globals': ['error', ...coreRestrictedGlobals],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '(^|/)(game|ui|store|platform)(/|$)',
              message: 'src/core must not import from game/, ui/, store/ or platform/.',
            },
            {
              regex: '^(idb|electron|node:.*)$',
              message: 'src/core is pure: storage and Node APIs live outside core.',
            },
          ],
        },
      ],
    },
  },
  prettier,
);
