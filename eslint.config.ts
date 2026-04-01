import { defineConfig, globalIgnores, type Config } from 'eslint/config';
import tsImports from 'eslint-config-vaadin/imports-typescript';
import testing from 'eslint-config-vaadin/testing';
import tsRequireTypeChecking from 'eslint-config-vaadin/typescript-requiring-type-checking';
import oxlint from 'eslint-plugin-oxlint';

const config: readonly Config[] = defineConfig(
  globalIgnores([
    'coverage/**/*',
    'dist/**/*',
    'docs/**/*',
    'node_modules/**/*',
    'storybook-static/**/*',
  ]),
  ...tsRequireTypeChecking,
  ...tsImports,
  ...testing,
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    rules: {
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-shadow': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/prefer-for-of': 'off',
      '@typescript-eslint/promise-function-async': 'off',
      'import-x/no-unresolved': [
        'error',
        {
          ignore: ['\\.css$'],
        },
      ],
      'import-x/no-unassigned-import': 'off',
      'import-x/no-duplicates': 'off',
      'import-x/no-extraneous-dependencies': 'off',
      'import-x/prefer-default-export': 'off',
      'guard-for-in': 'off',
    },
  },
  ...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json', { typeAware: true }),
  {
    // disable rules duplicated in Oxlint but not handled by
    // `buildFromOxlintConfigFile`.
    rules: {
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
      'import-x/no-mutable-exports': 'off',
    },
  },
);

export default config;
