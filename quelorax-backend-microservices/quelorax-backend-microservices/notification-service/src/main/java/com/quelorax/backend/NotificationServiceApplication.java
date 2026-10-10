package com.quelorax.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * notification-service — owns Notifications and FCM push tokens; sends SMS
 * pushes by calling auth-service and queue-service's internal APIs for the
 * user/queue data it needs but doesn't own. Port 8083.
 * See README-MICROSERVICES.md at the repo root.
 */
@SpringBootApplication
public class NotificationServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(NotificationServiceApplication.class, args);
    }
}
