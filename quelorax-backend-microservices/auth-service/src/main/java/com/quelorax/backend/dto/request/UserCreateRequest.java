package com.quelorax.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UserCreateRequest {
    @NotBlank private String name;
    @NotBlank @Email private String email;
    private String phone;
    @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") private String password;
    @NotBlank private String role;   // ADMIN | RECEPTIONIST | STAFF | VISITOR
    private Long departmentId;       // only relevant when role == STAFF
}
