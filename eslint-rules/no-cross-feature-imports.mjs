/**
 * Forbids imports from one feature module into another.
 * Applies only to files under src/app/features/{feature}/**.
 * Same-feature imports and imports from core/shared/models/shell are allowed.
 */

import path from 'node:path';

function getFeatureName(filePath) {
  const normalized = filePath.replaceAll('\\', '/');
  const index = normalized.indexOf('/src/app/features/');
  if (index === -1) return null;

  const remainder = normalized.slice(index + '/src/app/features/'.length);
  const slash = remainder.indexOf('/');
  return slash === -1 ? remainder : remainder.slice(0, slash);
}

function resolveImportSource(importerPath, importSource) {
  if (!importSource.startsWith('.')) {
    return importSource.replaceAll('\\', '/');
  }

  const importerDir = path.dirname(importerPath);
  return path.normalize(path.join(importerDir, importSource)).replaceAll('\\', '/');
}

function getFeatureFromResolvedPath(resolvedPath) {
  const normalized = resolvedPath.replaceAll('\\', '/');
  const marker = '/src/app/features/';
  const index = normalized.indexOf(marker);
  if (index === -1) return null;

  const remainder = normalized.slice(index + marker.length);
  const slash = remainder.indexOf('/');
  return slash === -1 ? remainder : remainder.slice(0, slash);
}

/** @type {import('eslint').Rule.RuleModule} */
export const noCrossFeatureImports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow imports across feature modules; features may only depend on core, shared, models, and shell.',
    },
    messages: {
      crossFeature:
        'Feature "{{current}}" must not import from feature "{{other}}". Use core/, shared/, or models/ instead.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    const currentFeature = getFeatureName(filename);
    if (!currentFeature) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const importSource = node.source.value;
        if (typeof importSource !== 'string') {
          return;
        }

        const resolved = resolveImportSource(filename, importSource);
        const targetFeature = getFeatureFromResolvedPath(resolved);
        if (!targetFeature || targetFeature === currentFeature) {
          return;
        }

        context.report({
          node: node.source,
          messageId: 'crossFeature',
          data: { current: currentFeature, other: targetFeature },
        });
      },
    };
  },
};
