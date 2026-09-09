/**
 * Stylelint configuration.
 *
 * The one non-standard rule here is the `transform` ban in animation CSS. The
 * design handoff is emphatic that the hero's four smoke plumes compose their
 * ambient drift only because they animate the `translate` / `rotate` / `scale`
 * longhands. The `transform` shorthand overwrites rather than composes, so a
 * well-meaning refactor to it silently breaks the signature effect with no
 * error and no visual clue beyond "the smoke stopped drifting".
 *
 * See design_handoff_wholesale_b2b/README.md § Hero smoke stage.
 */

/** @type {import('stylelint').Config} */
const config = {
  extends: ['stylelint-config-standard'],
  ignoreFiles: ['design_handoff_wholesale_b2b/**', '.next/**', 'node_modules/**'],
  rules: {
    // The token blocks are lifted verbatim from the handoff prototype. Custom
    // property names there are already consistent; do not enforce a pattern
    // that would require renaming them.
    'custom-property-pattern': null,
    // CSS Modules generate their own class names from camelCase keys.
    'selector-class-pattern': null,
  },
  overrides: [
    {
      files: [
        'src/styles/motion.css',
        'src/components/hero/**/*.css',
        '**/*.motion.css',
      ],
      rules: {
        'property-disallowed-list': [
          ['transform'],
          {
            message:
              'Use the translate / rotate / scale longhands, not the transform shorthand — the shorthand overwrites the composed ambient drift. See README § Hero smoke stage.',
          },
        ],
      },
    },
  ],
}

export default config
