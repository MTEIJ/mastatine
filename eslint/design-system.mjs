/**
 * Keeps the UI on the design system (see src/app/tokens.css, src/app/controls.css and src/components/ui).
 *
 *   design-system/use-ui-controls  no hand-written btn / card / badge / input / label / hint classes: use Button,
 *                                  Card, Badge, Input, Label, ... or buttonClass() and friends.
 *   design-system/use-tokens       no colours or corners from outside the tokens: Tailwind's default palette
 *                                  (bg-slate-200), arbitrary colours (text-[#333]), hex colours in style={{}}.
 */

const CONTROL = /(?:^|\s)!?(btn(?:-(?:primary|secondary|ghost|danger|sm))?|card|badge|input|label|hint)(?=\s|$)/;
const PALETTE =
  /(?:^|[\s:!])((?:bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|shadow|decoration|accent|caret)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})/;
const ARBITRARY_COLOUR = /(?:^|[\s:!])([a-z-]+-\[(?:#[0-9a-f]{3,8}|rgba?\(|hsla?\()[^\]]*\])/i;
const OLD_RADIUS = /(?:^|[\s:!])(rounded(?:-(?:t|b|l|r|s|e|x|y|tl|tr|bl|br))?(?:-(?:3xl|4xl))?)(?=\s|$)/;
const HEX = /#[0-9a-f]{3,8}\b/i;

const isClassAttribute = (name) => name === "className" || /^[a-z]\w*ClassName$/.test(name);

/** Every string piece inside a class attribute's value, with the node to report on. */
function classStrings(node, out = []) {
  if (!node) return out;
  switch (node.type) {
    case "Literal":
      if (typeof node.value === "string") out.push([node.value, node]);
      break;
    case "TemplateLiteral":
      for (const q of node.quasis) out.push([q.value.cooked ?? "", node]);
      for (const e of node.expressions) classStrings(e, out);
      break;
    case "JSXExpressionContainer":
      classStrings(node.expression, out);
      break;
    case "ConditionalExpression":
      classStrings(node.consequent, out);
      classStrings(node.alternate, out);
      break;
    case "LogicalExpression":
      classStrings(node.left, out);
      classStrings(node.right, out);
      break;
    default:
  }
  return out;
}

/** @type {import("eslint").Rule.RuleModule} */
const useUiControls = {
  meta: {
    type: "suggestion",
    docs: { description: "Use the shared controls from src/components/ui instead of their raw class names." },
    messages: {
      raw: "Write `{{name}}` through src/components/ui: <Button>, <Card>, <Badge>, <Input>, <Label>, ... or buttonClass() / cardClass() for another element.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier" || !isClassAttribute(node.name.name)) return;
        for (const [text, at] of classStrings(node.value)) {
          const match = CONTROL.exec(text);
          if (match) context.report({ node: at, messageId: "raw", data: { name: match[1] } });
        }
      },
      // A class list kept in a variable (`const button = "btn btn-sm"`): the btn prefix is unambiguous.
      Literal(node) {
        if (typeof node.value !== "string" || node.parent?.type === "JSXAttribute") return;
        const match = /(?:^|\s)(btn(?:-(?:primary|secondary|ghost|danger|sm))?)(?=\s|$)/.exec(node.value);
        if (match) context.report({ node, messageId: "raw", data: { name: match[1] } });
      },
    };
  },
};

/** @type {import("eslint").Rule.RuleModule} */
const useTokens = {
  meta: {
    type: "suggestion",
    docs: { description: "Colours and corners come from src/app/tokens.css." },
    messages: {
      palette: "`{{name}}` is Tailwind's default palette, which is switched off. Use a token colour (text-muted, bg-surface-container, border-outline-variant, ...).",
      arbitrary: "`{{name}}` hard-codes a colour. Use a token colour, or add a role to src/app/tokens.css.",
      radius: "`{{name}}` is not on the M3 corner scale. Use rounded-xs, -sm, -md, -lg, -xl, -2xl or -full.",
      hex: "Hex colour in a style. Use a token: var(--md-...).",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier") return;
        if (isClassAttribute(node.name.name)) {
          for (const [text, at] of classStrings(node.value)) {
            for (const [re, messageId] of [[PALETTE, "palette"], [ARBITRARY_COLOUR, "arbitrary"], [OLD_RADIUS, "radius"]]) {
              const match = re.exec(text);
              if (match) context.report({ node: at, messageId, data: { name: match[1] } });
            }
          }
        }
        if (node.name.name === "style" && node.value?.type === "JSXExpressionContainer") {
          const visit = (n) => {
            if (!n || typeof n !== "object") return;
            if (n.type === "Literal" && typeof n.value === "string" && HEX.test(n.value)) context.report({ node: n, messageId: "hex" });
            for (const key of ["expression", "properties", "value", "consequent", "alternate", "left", "right"]) {
              const child = n[key];
              if (Array.isArray(child)) child.forEach(visit);
              else visit(child);
            }
          };
          visit(node.value);
        }
      },
    };
  },
};

const plugin = {
  meta: { name: "design-system" },
  rules: { "use-ui-controls": useUiControls, "use-tokens": useTokens },
};

export default plugin;
