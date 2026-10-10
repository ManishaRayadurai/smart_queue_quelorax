package com.quelorax.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class EmailRequest {
    @NotBlank @Email private String email;
}
