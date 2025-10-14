/**
 * Custom error classes for better error handling
 */

export class InsufficientBalanceError extends Error {
  constructor(currency: string, required: number, available: number) {
    super(`Insufficient ${currency}: required ${required}, available ${available}`);
    this.name = 'InsufficientBalanceError';
  }
}

export class InvalidSlotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSlotError';
  }
}

export class BuildingNotIdleError extends Error {
  constructor(status: string) {
    super(`Building is not idle. Current status: ${status}`);
    this.name = 'BuildingNotIdleError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
