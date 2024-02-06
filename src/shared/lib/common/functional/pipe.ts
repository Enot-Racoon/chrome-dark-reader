import { BaseOperator, type Operator } from './base'

interface PipeInterface<I, O> {
  to<T>(nextOperator: Operator<O, T>): PipeInterface<I, T>
}

class Pipe<I, O> extends BaseOperator<I, O> implements PipeInterface<I, O> {
  public constructor(operator: Operator<I, O>) {
    super(operator)
  }

  public to<T>(nextOperator: Operator<O, T>): Pipe<I, T> {
    return new Pipe<I, T>((input: I) => nextOperator(this.compute(input)))
  }
}

function pipe<I, O>(operator: Operator<I, O>): Pipe<I, O> {
  return new Pipe<I, O>(operator)
}

export { Pipe }

export default pipe
