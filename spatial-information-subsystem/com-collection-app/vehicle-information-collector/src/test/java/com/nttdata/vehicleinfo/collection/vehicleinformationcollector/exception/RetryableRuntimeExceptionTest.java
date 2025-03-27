package com.nttdata.vehicleinfo.collection.vehicleinformationcollector.exception;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class RetryableRuntimeExceptionTest {
  @Test
  void constructor() {
    RetryableRuntimeException exception1 = new RetryableRuntimeException();
    assertTrue(exception1 instanceof RuntimeException);
    assertNull(exception1.getMessage());
    assertNull(exception1.getCause());

    String message = "test";
    RetryableRuntimeException exception2 = new RetryableRuntimeException("test");
    assertEquals(message, exception2.getMessage());
    assertNull(exception2.getCause());

    IllegalArgumentException cause = new IllegalArgumentException("IllegalArgumentException");
    RetryableRuntimeException exception3 = new RetryableRuntimeException(cause);
    assertEquals(cause, exception3.getCause());
    assertEquals(
        "java.lang.IllegalArgumentException: IllegalArgumentException", exception3.getMessage());

    RetryableRuntimeException exception4 = new RetryableRuntimeException(message, cause);
    assertEquals(cause, exception4.getCause());
    assertEquals(message, exception4.getMessage());
  }
}
