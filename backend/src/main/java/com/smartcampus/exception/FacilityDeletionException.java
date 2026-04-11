package com.smartcampus.exception;

public class FacilityDeletionException extends RuntimeException {
    public FacilityDeletionException(String message) {
        super(message);
    }
    
    public FacilityDeletionException(String message, Throwable cause) {
        super(message, cause);
    }
}
