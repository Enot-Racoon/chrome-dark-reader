import { BaseOperator, type Operator } from './base'

interface ComposeInterface<I, O> {
  from<T>(prevOperator: Operator<T, I>): ComposeInterface<T, O>
}

class Compose<I, O> extends BaseOperator<I, O> implements ComposeInterface<I, O> {
  public constructor(operator: Operator<I, O>) {
    super(operator)
  }

  public from<T>(prevOperator: Operator<T, I>): Compose<T, O> {
    return new Compose((input: T) => this.compute(prevOperator(input)))
  }
}

function compose<I, O>(nextCompose: Operator<I, O>): Compose<I, O> {
  return new Compose<I, O>(nextCompose)
}

export { Compose }

export default compose
