// PartiQL language support for CodeMirror 6, DynamoDB dialect:
//
//   partiql()             — LanguageSupport (highlighting + completion)
//   partiqlLinter()       — DynamoDB-dialect linter with quick fixes
//   partiqlHoverTooltip() — function docs + optional schema field info
//
// The parsing and diagnostics live in `dynamodb-partiql-parser` (zero-dep);
// this package is the CodeMirror wiring.

export {partiql} from './language';
export {
  canAutoExecutePartiQL,
  hasPartiQLErrors,
  lintPartiQL,
  partiqlLinter
} from './linter';
export {partiqlHoverTooltip} from './hover';
export type {PartiQLFieldInfo, PartiQLHoverOptions} from './hover';
export {PARTIQL_FUNCTIONS, PARTIQL_KEYWORDS, PARTIQL_OPERATORS} from './constants';
