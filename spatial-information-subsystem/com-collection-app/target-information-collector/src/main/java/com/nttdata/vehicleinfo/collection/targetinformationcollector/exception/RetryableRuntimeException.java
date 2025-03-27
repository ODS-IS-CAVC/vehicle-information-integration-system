package com.nttdata.vehicleinfo.collection.targetinformationcollector.exception;

/** リトライ可能な場合のRuntimeException */
public class RetryableRuntimeException extends RuntimeException {

  public RetryableRuntimeException() {
    super();
  }

  public RetryableRuntimeException(String message) {
    super(message);
  }

  public RetryableRuntimeException(Throwable cause) {
    super(cause);
  }

  public RetryableRuntimeException(String message, Throwable cause) {
    super(message, cause);
  }
}
