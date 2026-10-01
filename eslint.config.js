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
const mathRandom = {
  selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
  message: 'src/core is pure: inject `rng` instead of Math.random().',
};

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', '.claude'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...coreRestrictedSyntax, mathRandom],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '(^|/)(game|ui|store)(/|$)',
              message: 'src/core must not import from game/, ui/ or store/.',
            },
          ],
        },
      ],
    },
  },
  {
    // defaultRng is the single allowed Math.random() call site in core.
    files: ['src/core/rng.ts'],
    rules: { 'no-restricted-syntax': ['error', ...coreRestrictedSyntax] },
  },
  prettier,
);
