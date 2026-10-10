import { TaskCliError } from './TaskCliError.js';

export class ValidationError extends TaskCliError {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
