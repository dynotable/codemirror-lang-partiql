// PartiQL keywords supported by DynamoDB. Deliberately the DynamoDB dialect,
// not full PartiQL: LIMIT, GROUP BY, HAVING, AS, DISTINCT and aggregate
// functions are absent because DynamoDB rejects them — the linter flags them
// with quick fixes where one exists.
export const PARTIQL_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'INSERT',
  'INTO',
  'VALUE',
  'UPDATE',
  'SET',
  'REMOVE', // UPDATE ... REMOVE <attr> WHERE — DDB PartiQL UPDATE supports REMOVE alongside SET.
  'DELETE',
  'AND',
  'OR',
  'NOT',
  'BETWEEN',
  'IN',
  'LIKE',
  'IS',
  'NULL',
  'TRUE',
  'FALSE',
  'ORDER',
  'BY',
  'ASC',
  'DESC',
  'MISSING'
];

// The complete set of functions DynamoDB PartiQL supports. String functions
// (upper, lower, substring, trim) and CAST are NOT supported by DynamoDB.
export const PARTIQL_FUNCTIONS = [
  'attribute_exists',
  'attribute_not_exists',
  'attribute_type',
  'begins_with',
  'contains',
  'size'
];

// Common operators for WHERE and SET clauses.
export const PARTIQL_OPERATORS = ['=', '<>', '>', '<', '>=', '<=', 'BETWEEN', 'IN', 'LIKE'];
