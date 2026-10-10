package com.quelorax.backend.controller;

import com.quelorax.backend.entity.QueueToken;
import com.quelorax.backend.service.QueueTokenService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Service-to-service (east-west) API — NOT exposed to the outside world.
 * See InternalUserController in auth-service for the full explanation of
 * why this is safe: the api-gateway simply never routes "/api/internal/**".
 *
 * notification-service calls this to find which visitors currently have an
 * active token in a department, so it can fan a "department" broadcast out
 * to the right people, without notification-service owning a copy of the
 * queue-tokens table itself.
 */
@RestController
@RequestMapping("/api/internal/tokens")
public class InternalTokenController {

    private final QueueTokenService service;

    public InternalTokenController(QueueTokenService service) {
        this.service = service;
    }

    @GetMapping("/department/{deptId}")
    public List<QueueToken> getByDepartment(@PathVariable Long deptId) {
        return service.getByDepartment(deptId);
    }
}
