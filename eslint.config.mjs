// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'operator-linebreak': 'off',
    'indent': 'off',
    '@stylistic/indent': 'off',
    '@stylistic/indent-binary-ops': 'off',
    '@stylistic/operator-linebreak': 'off',
    '@stylistic/arrow-parens': 'off',
    '@stylistic/member-delimiter-style': 'off',
    '@stylistic/quote-props': 'off',
    '@stylistic/quotes': 'off',
    '@stylistic/no-trailing-spaces': 'off',
    '@stylistic/no-multiple-empty-lines': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/singleline-html-element-content-newline': 'off'
  }
})
