# Contributing

Standard pnpm workflow:

```sh
pnpm install
pnpm test        # vitest
pnpm typecheck   # tsc --noEmit
pnpm lint        # oxlint
pnpm build       # tsdown (ESM + CJS + d.ts)
```

CI runs all of the above plus `publint` and `@arethetypeswrong/cli` on every PR.

## Local development against the parser

`package.json` carries a pnpm override linking `dynamodb-partiql-parser` to a
sibling checkout at `../dynamodb-partiql-parser` for development. Clone both
repos side by side. The override only affects installs run inside this repo;
the published package depends on the npm version.
