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
      // tokens.css is a 1:1 transcription of the handoff's token table, kept
      // that way so a reviewer can diff the file against the table line for
      // line. These four rules are purely cosmetic — `#ffffff` and `#fff`,
      // `rgba(0,0,0,.28)` and `rgb(0 0 0 / 28%)` are the same colour — so
      // enforcing them here would churn the transcription for no behavioural
      // gain and break that correspondence. They stay on everywhere else.
      files: ['src/styles/tokens.css'],
      rules: {
        'color-hex-length': null,
        'color-function-notation': null,
        'color-function-alias-notation': null,
        'alpha-value-notation': null,
      },
    },
    {
      files: ['src/styles/motion.css', 'src/components/hero/**/*.css'],
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
