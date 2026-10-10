package com.quelorax.backend.controller;

import com.quelorax.backend.dto.request.NotificationCreateRequest;
import com.quelorax.backend.entity.Notification;
import com.quelorax.backend.service.NotificationService;
import org.springframework.web.bind.annotation.*;

/**
 * Service-to-service (east-west) API — NOT exposed to the outside world.
 * See InternalUserController (auth-service) for the full explanation.
 *
 * queue-service calls this whenever a token's status changes (called for
 * service, delayed, missed, completed) so the visitor gets an SMS/push
 * notification about their queue update, without queue-service needing to
 * carry a visitor's JWT around or duplicate notification-service's
 * SMS/push-sending logic itself.
 */
@RestController
@RequestMapping("/api/internal/notifications")
public class InternalNotificationController {

    private final NotificationService service;

    public InternalNotificationController(NotificationService service) {
        this.service = service;
    }

    @PostMapping("/user")
    public Notification notifyUser(@RequestBody NotificationCreateRequest req) {
        req.setScope("user");
        return service.create(req);
    }
}
