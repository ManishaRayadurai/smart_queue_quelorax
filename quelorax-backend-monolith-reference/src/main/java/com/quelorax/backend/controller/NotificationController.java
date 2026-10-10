package com.quelorax.backend.controller;

import com.quelorax.backend.dto.request.MarkReadRequest;
import com.quelorax.backend.dto.request.NotificationCreateRequest;
import com.quelorax.backend.entity.Notification;
import com.quelorax.backend.service.NotificationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}
