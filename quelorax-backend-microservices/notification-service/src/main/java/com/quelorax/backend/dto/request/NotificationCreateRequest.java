package com.quelorax.backend.dto.request;

import lombok.Data;

@Data
public class NotificationCreateRequest {
    private Long userId;       // for scope=user
    private String scope;      // user | org | department | role
    private Long departmentId; // for scope=department
    private String role;       // for scope=role
    private String type;
    private String title;
    private String message;
}
