export class ActionResult<T> {
  public readonly Result: T;

  public readonly IsSuccess: boolean;

  public readonly Error: Error;

  public readonly ErrorMessage: string;

  public readonly ErrorCode: number | undefined;

  private constructor(init?: Partial<ActionResult<T>>) {
    Object.assign(this, init);
  }

  static Success<T>(result: T): ActionResult<T> {
    return new ActionResult({ Result: result, IsSuccess: true });
  }

  static FailWithError<T>(error: Error, errorCode: number | undefined): ActionResult<T> {
    return new ActionResult<T>({ Error: error, IsSuccess: false, ErrorCode: errorCode });
  }

  static FailWithMessage<T>(errorMessage: string, errorCode: number | undefined): ActionResult<T> {
    return new ActionResult<T>({ ErrorMessage: errorMessage, IsSuccess: false, ErrorCode: errorCode });
  }
}
