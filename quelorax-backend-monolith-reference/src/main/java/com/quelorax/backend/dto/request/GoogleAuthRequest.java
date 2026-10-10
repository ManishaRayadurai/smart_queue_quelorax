package com.quelorax.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleAuthRequest {
    @NotBlank
    private String credential; // the raw Google ID token (JWT) from Google Identity Services
}
