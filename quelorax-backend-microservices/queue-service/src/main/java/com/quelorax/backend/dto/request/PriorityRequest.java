package com.quelorax.backend.dto.request;

import lombok.Data;

@Data
public class PriorityRequest {
    private String priority; // normal | senior | emergency | vip
}
