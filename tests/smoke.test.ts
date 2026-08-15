// @vitest-environment jsdom
import {EditorState} from '@codemirror/state';
import {describe, expect, it} from 'vitest';

import {
  canAutoExecutePartiQL,
  hasPartiQLErrors,
  lintPartiQL,
  partiql,
  partiqlLinter,
  PARTIQL_FUNCTIONS,
  PARTIQL_KEYWORDS
} from '../src';

describe('partiql() language support', () => {
  it('should build an EditorState with the language extension', () => {
    const state = EditorState.create({
      doc: "SELECT * FROM \"Orders\" WHERE OrderID = 100",
      extensions: [partiql()]
    });
    expect(state.doc.toString()).toContain('SELECT');
  });

  it('should expose the DynamoDB keyword and function sets', () => {
    expect(PARTIQL_KEYWORDS).toContain('MISSING');
    expect(PARTIQL_KEYWORDS).not.toContain('LIMIT'); // DDB rejects LIMIT
    expect(PARTIQL_FUNCTIONS).toContain('begins_with');
  });
});

describe('lintPartiQL', () => {
  it('should return no error diagnostics for a clean DDB SELECT', () => {
    const diagnostics = lintPartiQL('SELECT * FROM "Orders" WHERE OrderID = 100');
    expect(diagnostics.filter((d) => d.severity === 'error')).toEqual([]);
  });

  it('should flag a JOIN as DynamoDB-unsupported', () => {
    const diagnostics = lintPartiQL('SELECT * FROM t JOIN u ON t.x = u.x');
    expect(diagnostics.some((d) => d.severity === 'error')).toBe(true);
    expect(diagnostics.map((d) => d.message).join(' ')).toMatch(/JOIN/i);
  });

  it('should attach a quick-fix action for IN (paren-list)', () => {
    const diagnostics = lintPartiQL("SELECT * FROM t WHERE x IN ('a', 'b')");
    const withFix = diagnostics.find((d) => d.actions && d.actions.length > 0);
    expect(withFix).toBeDefined();
  });

  it('should degrade, not throw, on garbage input', () => {
    expect(() => lintPartiQL('#'.repeat(50_000))).not.toThrow();
  });
});

describe('hasPartiQLErrors / canAutoExecutePartiQL', () => {
  it('should report errors for unsupported constructs', () => {
    expect(hasPartiQLErrors('SELECT * FROM t GROUP BY x')).toBe(true);
    expect(hasPartiQLErrors('SELECT * FROM t WHERE x = 1')).toBe(false);
  });

  it('should never auto-execute writes', () => {
    expect(canAutoExecutePartiQL("INSERT INTO t VALUE {'id': 1}")).toBe(false);
    expect(canAutoExecutePartiQL("UPDATE t SET x = 1 WHERE id = 1")).toBe(false);
    expect(canAutoExecutePartiQL("DELETE FROM t WHERE id = 1")).toBe(false);
    expect(canAutoExecutePartiQL('SELECT * FROM t WHERE id = 1')).toBe(true);
  });
});

describe('partiqlLinter', () => {
  it('should be usable as an EditorState extension', () => {
    const state = EditorState.create({
      doc: 'SELECT * FROM t',
      extensions: [partiql(), partiqlLinter()]
    });
    expect(state).toBeDefined();
  });
});
