const PHYSICAL =
  /^(ml|mr|pl|pr|left|right|text-left|text-right|float-left|float-right|clear-left|clear-right|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br|border-l|border-r|scroll-ml|scroll-mr|scroll-pl|scroll-pr)(-|$)/

const CLASS_FNS = new Set(['cn', 'cva', 'clsx', 'twMerge'])

const LOGICAL = {
  ml: 'ms',
  mr: 'me',
  pl: 'ps',
  pr: 'pe',
  left: 'start',
  right: 'end',
  'text-left': 'text-start',
  'text-right': 'text-end',
  'rounded-l': 'rounded-s',
  'rounded-r': 'rounded-e',
  'border-l': 'border-s',
  'border-r': 'border-e',
}

export function findPhysicalClasses(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => {
      const base = token
        .slice(token.lastIndexOf(':') + 1)
        .replace(/^!/, '')
        .replace(/^-/, '')
      return PHYSICAL.test(base)
    })
}

function inClassContext(ancestors) {
  return ancestors.some(
    (a) =>
      (a.type === 'JSXAttribute' && (a.name.name === 'className' || a.name.name === 'class')) ||
      (a.type === 'CallExpression' && a.callee.type === 'Identifier' && CLASS_FNS.has(a.callee.name)),
  )
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow physical-direction Tailwind classes; use logical ones (ms/me/ps/pe/start/end).',
    },
    messages: {
      physical: '"{{cls}}" is a physical-direction class. Use the logical equivalent{{hint}} so RTL works.',
    },
    schema: [],
  },
  create(context) {
    const check = (node, value) => {
      if (typeof value !== 'string') return
      if (!inClassContext(context.sourceCode.getAncestors(node))) return
      for (const cls of findPhysicalClasses(value)) {
        const base = cls.slice(cls.lastIndexOf(':') + 1).replace(/^[!-]+/, '')
        const key = Object.keys(LOGICAL).find((k) => base === k || base.startsWith(`${k}-`))
        context.report({
          node,
          messageId: 'physical',
          data: { cls, hint: key ? ` (${LOGICAL[key]}-…)` : '' },
        })
      }
    }
    return {
      Literal: (node) => check(node, node.value),
      TemplateElement: (node) => check(node, node.value.cooked),
    }
  },
}
