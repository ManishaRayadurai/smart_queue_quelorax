package com.quelorax.backend.dto.request;

import lombok.Data;

@Data
public class MarkReadRequest {
    private Long userId;
    private String role;
    private Long departmentId;
}
