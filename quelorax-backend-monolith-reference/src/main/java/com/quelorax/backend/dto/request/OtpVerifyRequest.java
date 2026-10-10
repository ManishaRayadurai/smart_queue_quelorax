package com.quelorax.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class OtpVerifyRequest {
    @NotBlank @Email private String email;
    @NotBlank private String otp;
}
