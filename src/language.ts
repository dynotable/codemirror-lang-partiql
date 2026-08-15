import {sql, SQLDialect} from '@codemirror/lang-sql';
import type {LanguageSupport} from '@codemirror/language';

import {PARTIQL_KEYWORDS} from './constants';

const PartiQLDialect = SQLDialect.define({
  keywords: PARTIQL_KEYWORDS.join(' ').toLowerCase(),
  types: 'string int bool list struct sexp bag',
  specialVar: '$',
  hashComments: false,
  backslashEscapes: true
});

/**
 * PartiQL language support for CodeMirror 6 (DynamoDB dialect): syntax
 * highlighting for the keyword/type set DynamoDB actually accepts, `--` line
 * comments, and upper-cased keyword completion.
 */
export function partiql(): LanguageSupport {
  return sql({dialect: PartiQLDialect, upperCaseKeywords: true});
}
