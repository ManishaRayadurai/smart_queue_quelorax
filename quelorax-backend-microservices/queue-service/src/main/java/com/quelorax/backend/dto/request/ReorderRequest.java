package com.quelorax.backend.dto.request;

import lombok.Data;

@Data
public class ReorderRequest {
    private String direction; // up | down
}
