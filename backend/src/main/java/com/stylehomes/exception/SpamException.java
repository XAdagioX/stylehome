package com.stylehomes.exception;

/**
 * Exception thrown when spam or abuse is detected.
 */
public class SpamException extends RuntimeException {
    
    public SpamException(String message) {
        super(message);
    }
    
    public SpamException(String message, Throwable cause) {
        super(message, cause);
    }
}
