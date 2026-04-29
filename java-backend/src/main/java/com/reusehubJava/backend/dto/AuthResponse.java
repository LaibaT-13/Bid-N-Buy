package com.reusehubJava.backend.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private final String jwt;
    private final String message;
    private final boolean isWarned;
    private final String warningReason;
    
    public AuthResponse(String jwt) {
        this.jwt = jwt;
        this.message = "Authentication successful";
        this.isWarned = false;
        this.warningReason = null;
    }
    
    public AuthResponse(String jwt, String message, boolean isWarned, String warningReason) {
        this.jwt = jwt;
        this.message = message;
        this.isWarned = isWarned;
        this.warningReason = warningReason;
    }
}
