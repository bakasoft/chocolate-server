import { parseValue } from './expressions'

function testExpression({ input, output, scope }) {
  const expr = parseValue(input)
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
    output: { flag: true },
    scope: {
      users: {
        '001': {
          config: { flag: true },
        },
      },
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

test('function invocation no arguments', () => {
  testExpression({
    input: '{today()}',
    output: '2021-03-24',
    scope: {
      today: () => '2021-03-24',
    },
  })
})

test('function invocation with arguments', () => {
  testExpression({
    input: '{ test ( a, { b }, c ) }',
    output: 'a 0 c',
    scope: {
      b: 0,
      test: (a, b, c) => [a, b, c].join(' '),
    },
  })
})

test('function invocation with complex arguments', () => {
  testExpression({
    input: '{test({a}, {b})}',
    output: '1 0',
    scope: {
      a: 1,
      b: 0,
      test: (a, b) => [a, b].join(' '),
    },
  })
})
