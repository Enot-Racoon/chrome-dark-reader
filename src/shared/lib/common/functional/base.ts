type Operator<I, O> = (input: I) => O

interface OperatorInterface<I, O> {
  build(): Operator<I, O>

  compute(input: I): ReturnType<Operator<I, O>>
}

abstract class BaseOperator<I, O> implements OperatorInterface<I, O> {
  protected operator: Operator<I, O>

  protected constructor(operator: Operator<I, O>) {
    this.operator = operator
  }

  public build(): Operator<I, O> {
    return this.operator
  }

  public compute(input: I): O {
    return this.operator(input)
  }
}

export { BaseOperator, type Operator }
