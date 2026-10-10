package com.quelorax.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank private String name;
    @NotBlank @Email private String email;
    @NotBlank(message = "Phone number is required to send your verification code")
    @Pattern(regexp = "^\\+[1-9]\\d{7,14}$", message = "Phone must be in E.164 format, e.g. +919876543210")
    private String phone;
    @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") private String password;
}
