package com.quelorax.backend.controller;

import com.quelorax.backend.dto.request.MarkReadRequest;
import com.quelorax.backend.dto.request.NotificationCreateRequest;
import com.quelorax.backend.entity.Notification;
import com.quelorax.backend.filter.JwtAuthFilter;
import com.quelorax.backend.service.NotificationService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public List<Notification> getForUser(@RequestParam Long userId,
                                          @RequestParam(required = false) String role,
                                          @RequestParam(required = false) Long departmentId) {
        return service.getForUser(userId, role, departmentId);
    }

    @PostMapping
    public Notification create(@RequestBody NotificationCreateRequest req) {
        return service.create(req);
    }

    @PostMapping("/{id}/read")
    public void markRead(@PathVariable Long id, @RequestParam Long userId) {
        service.markRead(id, userId);
    }

    @PostMapping("/read-all")
    public void markAllRead(@RequestBody MarkReadRequest req) {
        service.markAllRead(req.getUserId(), req.getRole(), req.getDepartmentId());
    }

    // Moved here from auth-service's UserController — FCM push tokens are a
    // notification-delivery concern, so notification-service is the one
    // that should own that table (see service/NotificationService.java).
    @PostMapping("/fcm-token")
    public void registerFcmToken(Authentication auth, @RequestBody Map<String, String> body) {
        JwtAuthFilter.AuthenticatedUser principal = (JwtAuthFilter.AuthenticatedUser) auth.getPrincipal();
        service.registerFcmToken(principal.userId(), body.get("token"));
    }

    @PostMapping("/fcm-token/unregister")
    public void unregisterFcmToken(@RequestBody Map<String, String> body) {
        service.unregisterFcmToken(body.get("token"));
    }
}
