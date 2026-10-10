package com.quelorax.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TokenCreateRequest {
    private Long userId;           // nullable for walk-ins
    @NotNull private String visitorName;
    private String phone;
    @NotNull private Long departmentId;
    private String purpose;
    private boolean walkIn;
    private Long slotTime;         // epoch ms, null = ASAP
    private String priority;       // normal | senior | emergency | vip (default normal)
}
