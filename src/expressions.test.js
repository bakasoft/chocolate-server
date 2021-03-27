const expressions = require('./expressions');

function testExpression({ input, output, scope }) {
  const expr = expressions.parse(input)
  const result = expr.resolve(scope)

  expect(result).toEqual(output)
}

test('string literal', () => {
  testExpression({
    input: 'abc',
    output: 'abc', 
    scope: {},
  })
})

test('number literal', () => {
  testExpression({
    input: 1.5,
    output: 1.5, 
    scope: {},
  })
})

test('boolean literal', () => {
  testExpression({
    input: true,
    output: true, 
    scope: {},
  })
})

test('null literal', () => {
  testExpression({
    input: null,
    output: null, 
    scope: {},
  })
})

test('undefined literal', () => {
  testExpression({
    input: undefined,
    output: undefined, 
    scope: {},
  })
})

test('simple get', () => {
  testExpression({
    input: '{id}', 
    output: 1, 
    scope: {
      id: 1,
    },
  })
})

test('nested attributes', () => {
  testExpression({
    input: '{users.001.config}',
    output: {flag: true}, 
    scope: {
      users: {
        '001': {
          config: {flag: true}
        }
      }
    },
  })
})

test('simple concatenation', () => {
  testExpression({
    input: 'user-{id}/', 
    output: 'user-1/', 
    scope: {
      id: 1,
    },
  })
})

test('advanced concatenation', () => {
  testExpression({
    input: 'User: {name} (#{id})',
    output: 'User: Mat (#1)', 
    scope: {
      id: 1,
      name: 'Mat',
    },
  })
})

test('nested expressions', () => {
  testExpression({
    input: '{user{id}}', 
    output: 'Mat',
    scope: {
      id: 1,
      user1: 'Mat',
    },
  })
})

test('function invocation', () => {
  testExpression({
    input: '{today()}', 
    output: '2021-03-24',
    scope: {
      today: () => '2021-03-24'
    },
  })
})
