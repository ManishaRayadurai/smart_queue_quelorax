package com.quelorax.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Tells notification-service to alert a specific visitor about a queue
 * update (their turn is up, they got delayed, they were marked missed,
 * their visit is complete). notification-service is the one that actually
 * sends the SMS/push — see its NotificationService.sendNotificationToUser.
 *
 * This calls notification-service's internal-only API, not the public one
 * ("/api/notifications" requires a logged-in JWT — queue-service doesn't
 * have the visitor's token lying around when staff clicks "Call Next").
 *
 * Failures here are swallowed on purpose: a notification-service hiccup
 * should never block a receptionist from calling the next visitor or
 * completing a token. The queue action itself always succeeds regardless.
 */
@Component
public class QueueNotificationClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.services.notification-url}")
    private String notificationServiceUrl;

    public void notifyUser(Long userId, String type, String title, String message) {
        if (userId == null) return; // walk-ins with no account have nothing to notify
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("userId", userId);
            body.put("type", type);
            body.put("title", title);
            body.put("message", message);
            restTemplate.postForObject(notificationServiceUrl + "/api/internal/notifications/user", body, Object.class);
        } catch (RestClientException e) {
            // notification-service being down/unreachable shouldn't break queue operations
        }
    }
}
