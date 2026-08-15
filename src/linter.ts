// CodeMirror linter over `dynamodb-partiql-parser`:
//
//   parse(text) → CST + structural diagnostics
//   findUnsupportedConstructs(cst, text) → DDB-unsupported diagnostics
//
// Public surface:
//   - lintPartiQL(text): CodeMirror Diagnostic[]
//   - hasPartiQLErrors(text): boolean
//   - canAutoExecutePartiQL(query): boolean  (read-only + clean → safe to run)
//   - partiqlLinter(): Extension  (500ms debounced linter)

import {type Action, type Diagnostic, linter} from '@codemirror/lint';
import type {Extension} from '@codemirror/state';
import {
  DIAGNOSTIC_CODES,
  findUnsupportedConstructs,
  parse,
  type Diagnostic as ParserDiagnostic,
  type QuickFix
} from 'dynamodb-partiql-parser';

// Statement kinds that mutate data — never safe to auto-execute.
const WRITE_STATEMENT_KINDS = new Set(['insert_statement', 'update_statement', 'delete_statement']);

interface Analysis {
  diagnostics: ParserDiagnostic[];
  firstStatementKind: string | undefined;
}

// Single-entry cache keyed by document-string identity, so per-keystroke
// `lintPartiQL` + `canAutoExecutePartiQL` calls with the same string share one
// parse + walk (the linter runs both on every change).
let cachedKey: string | undefined;
let cachedAnalysis: Analysis | undefined;

function analyze(text: string): Analysis {
  if (cachedKey === text && cachedAnalysis) return cachedAnalysis;

  let result: Analysis;
  try {
    const {cst, diagnostics: parseDiagnostics} = parse(text);
    // Drop the parser's informational `IN (...)` quick-fix: the unsupported
    // walker re-emits the same fix as a proper error, so keeping both would
    // double-report the construct in the gutter.
    const structural = parseDiagnostics.filter((d) => d.code !== DIAGNOSTIC_CODES.quickFix);
    const unsupported = findUnsupportedConstructs(cst, text);
    result = {
      diagnostics: [...structural, ...unsupported],
      firstStatementKind: cst.statements[0]?.kind
    };
  } catch {
    // Defense in depth: the parser is designed never to throw, but a linter
    // runs on every keystroke inside CodeMirror with no error sink — one
    // uncaught throw would white-screen the editor. Degrade to a single
    // generic error instead, and treat the statement kind as unknown so
    // auto-execute stays gated.
    result = {
      diagnostics: [
        {
          code: DIAGNOSTIC_CODES.parseError,
          message: 'Could not parse this PartiQL statement.',
          range: {start: 0, end: text.length},
          severity: 'error'
        }
      ],
      firstStatementKind: undefined
    };
  }

  cachedKey = text;
  cachedAnalysis = result;
  return result;
}

function toAction(fix: QuickFix): Action {
  return {
    name: fix.label,
    // `from`/`to` are CodeMirror's live diagnostic range (mapped through any
    // edits since the linter ran). Use them instead of `fix.edit.start/end`
    // (captured at lint time) — otherwise editing outside the diagnostic
    // range between linter runs shifts positions and the action would dispatch
    // against stale offsets, corrupting the document.
    apply(view, from, to) {
      view.dispatch({
        changes: {from, to, insert: fix.edit.text}
      });
    }
  };
}

function toCodeMirror(d: ParserDiagnostic): Diagnostic {
  return {
    from: d.range.start,
    to: d.range.end,
    severity: d.severity ?? 'error',
    message: d.message,
    source: d.code,
    ...(d.actions && d.actions.length > 0 ? {actions: d.actions.map(toAction)} : {})
  };
}

/** Lint a PartiQL string into CodeMirror diagnostics (with quick-fix actions). */
export function lintPartiQL(text: string): Diagnostic[] {
  return analyze(text).diagnostics.map(toCodeMirror);
}

/** Whether the text has any error-severity diagnostic. */
export function hasPartiQLErrors(text: string): boolean {
  return analyze(text).diagnostics.some((d) => (d.severity ?? 'error') === 'error');
}

/**
 * True iff `query` is a read (SELECT/empty) with no lint errors. Gates
 * auto-execute shortcuts so a write or malformed query never fires silently.
 */
export function canAutoExecutePartiQL(query: string): boolean {
  const {firstStatementKind, diagnostics} = analyze(query);
  if (firstStatementKind && WRITE_STATEMENT_KINDS.has(firstStatementKind)) return false;
  return !diagnostics.some((d) => (d.severity ?? 'error') === 'error');
}

/** The linter as a CodeMirror extension (500ms debounce). */
export function partiqlLinter(): Extension {
  return linter((view) => lintPartiQL(view.state.doc.toString()), {delay: 500});
}
