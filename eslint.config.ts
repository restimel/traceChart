import pluginVue from 'eslint-plugin-vue';
import type { TSESLint } from '@typescript-eslint/utils';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
// import pluginVitest from '@vitest/eslint-plugin';

/*
 * To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
 * import { configureVueProject } from '@vue/eslint-config-typescript'
 * configureVueProject({ scriptLangs: ['ts', 'tsx'] })
 * More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup
 */

/*
 * XXX: recasting to TSESLint.FlatConfig.Config is necessary because
 * Linter.Config support newer version of Ecmascript so types are
 * considered as different by TS
 */
const pluginVueEssential = pluginVue.configs['flat/essential'] as TSESLint.FlatConfig.Config[];

export default defineConfigWithVueTs(
    {
        name: 'app/files-to-lint',
        files: ['**/*.{ts,mts,tsx,vue}'],
    },

    {
        name: 'app/files-to-ignore',
        ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
    },

    pluginVueEssential,
    vueTsConfigs.recommended,

    {
        // ...pluginVitest.configs.recommended,
        files: ['src/**/__tests__/*'],
    },
    {
        rules: {
            'comma-dangle': ['error', {
                'arrays': 'always-multiline',
                'objects': 'always-multiline',
                'imports': 'always-multiline',
                'exports': 'always-multiline',
                'functions': 'never',
            }],
            'indent': ['error', 4, { 'SwitchCase': 1 }],
            'multiline-comment-style': ['error', 'starred-block'],
            'no-console': 'error',
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
        },
    }
);
