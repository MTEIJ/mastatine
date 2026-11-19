/**
 * Only the design-system rules, no style opinions: colours and corner radii come from src/app/tokens.css.
 *   - tokens.css is where the raw values live;
 *   - legacy.css is the original homepage stylesheet, kept as it was;
 *   - plugins are themed mini-apps with their own palette, which they declare as custom properties at their root;
 *     the advent scene is an illustration.
 */
const RADIUS_LENGTH = "/(?<![\\w.-])\\d*\\.?\\d+(px|rem|em)\\b/";

const config = {
  ignoreFiles: ["src/app/tokens.css", "src/app/legacy.css", "src/plugins/advent/scene.css"],
  rules: {
    "color-no-hex": [true, { message: "Use a colour token from src/app/tokens.css (var(--md-...))." }],
    "declaration-property-value-disallowed-list": [
      { "/radius$/": [RADIUS_LENGTH] },
      { message: "Use a corner token from src/app/tokens.css (var(--shape-...))." },
    ],
  },
  overrides: [
    {
      files: ["src/plugins/**/*.css"],
      rules: {
        "color-no-hex": null,
        "declaration-property-value-disallowed-list": [
          { "/^(?!--)/": ["/#[0-9a-fA-F]{3,8}\\b/"] },
          { message: "Declare plugin colours once as custom properties on the plugin's root and use var(--...) here." },
        ],
      },
    },
  ],
};
export default config;
