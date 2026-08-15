# codemirror-lang-partiql

PartiQL language support for CodeMirror 6, targeting the DynamoDB dialect: syntax highlighting, a linter that knows what DynamoDB rejects, quick fixes, and hover tooltips.

Parsing and diagnostics come from [dynamodb-partiql-parser](https://github.com/dynotable/dynamodb-partiql-parser); this package is the CodeMirror wiring. It's extracted from the PartiQL editor in [DynoTable](https://dynotable.com), where it lints on every keystroke.

## Install

```sh
npm install codemirror-lang-partiql
```

## Usage

```ts
import {EditorView} from '@codemirror/view';
import {partiql, partiqlLinter, partiqlHoverTooltip} from 'codemirror-lang-partiql';

new EditorView({
  doc: 'SELECT * FROM "Orders" WHERE OrderID = 100',
  extensions: [partiql(), partiqlLinter(), partiqlHoverTooltip()],
  parent: document.querySelector('#editor')!
});
```

Type `SELECT * FROM t GROUP BY x` and the linter underlines it with "GROUP BY is not supported by DynamoDB PartiQL.". Constructs with a known rewrite (`IN (...)`, `LIKE`, `IS NULL`) get a quick-fix action in the diagnostic panel.

## API

| Export | What it does |
| --- | --- |
| `partiql()` | `LanguageSupport`: highlighting and keyword completion for the DynamoDB PartiQL keyword set. |
| `partiqlLinter()` | The DynamoDB-dialect linter as an extension, debounced at 500ms, with quick-fix actions. |
| `partiqlHoverTooltip(options?)` | Hover docs for PartiQL functions; pass `getFieldInfo` to also show your schema's field types on hover. |
| `lintPartiQL(text)` | The linter as a function. Returns CodeMirror `Diagnostic[]`. |
| `hasPartiQLErrors(text)` | True when any diagnostic is error severity. |
| `canAutoExecutePartiQL(text)` | True for a clean read statement. Gate auto-run shortcuts on this so a write never fires silently. |
| `PARTIQL_KEYWORDS`, `PARTIQL_FUNCTIONS`, `PARTIQL_OPERATORS` | The DynamoDB dialect sets, exported as data. |

### Schema-aware hover

The editor this came from resolves attribute paths against a local index of the connected table. That dependency is inverted here: hand `partiqlHoverTooltip` an async resolver and it renders whatever your app knows about a field.

```ts
partiqlHoverTooltip({
  getFieldInfo: async (path) => {
    const field = mySchema.lookup(path);
    return field ? {path, dataType: field.type, occurrenceCount: field.count} : null;
  }
});
```

Without options, hover still documents the built-in functions (`begins_with`, `attribute_exists`, `contains`, ...).

## Why the linter matters

DynamoDB accepts a narrow PartiQL subset and rejects everything else at request time. An editor that only highlights SQL keywords lets you type `SELECT COUNT(*) FROM t GROUP BY x` and find out from a `ValidationException`. This linter reports the rejection while you type, with the DynamoDB-idiomatic replacement where one exists. The rule set and its fixture corpus live in the parser package.

## Related

- [dynamodb-partiql-parser](https://github.com/dynotable/dynamodb-partiql-parser), the underlying zero-dependency parser and linter
- [DynamoDB PartiQL guide](https://dynotable.com/learn/dynamodb-partiql-examples), a walkthrough of the dialect itself

## License

MIT © [DynoTable](https://dynotable.com)
