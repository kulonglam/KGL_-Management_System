/** Shared accessibility test helpers that wrap axe-core execution and violation assertions. */
import axe from 'axe-core';

const DEFAULT_RULES = {
  'color-contrast': { enabled: false }
};

export const runA11yAudit = async (container, options = {}) => {
  const source = container && container.nodeType === 1 ? container : document.body;
  const sandbox = document.createElement('div');
  sandbox.setAttribute('data-testid', 'a11y-sandbox');
  sandbox.appendChild(source.cloneNode(true));
  document.body.appendChild(sandbox);

  try {
    return await axe.run(sandbox, {
      rules: {
        ...DEFAULT_RULES,
        ...(options.rules || {})
      },
      ...options
    });
  } finally {
    sandbox.remove();
  }
};

export const expectNoA11yViolations = (results) => {
  if (!results || !Array.isArray(results.violations) || results.violations.length === 0) {
    return;
  }

  const details = results.violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => node.target?.join(' ') || '(unknown target)')
        .join(', ');
      return `${violation.id}: ${violation.help} -> ${nodes}`;
    })
    .join('\n');

  throw new Error(`Accessibility violations found:\n${details}`);
};

