package com.quelorax.backend.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

@Service
public class FcmService {

    private static final Logger log = LoggerFactory.getLogger(FcmService.class);
    private boolean initialized = false;

    @Value("${app.firebase.credentials-path:firebase-service-account.json}")
    private String credentialsPath;

    @PostConstruct
    public void init() {
        File file = new File(credentialsPath);
        if (!file.exists()) {
            log.warn("Firebase service account credentials file not found at: {} — FCM notifications are disabled (running in simulation mode)", file.getAbsolutePath());
            return;
        }

        try (FileInputStream fis = new FileInputStream(file)) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(fis))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
            initialized = true;
            log.info("Firebase Admin SDK successfully initialized from {}", credentialsPath);
        } catch (IOException e) {
            log.error("Failed to initialize Firebase Admin SDK: {}", e.getMessage());
        }
    }

    public boolean isConfigured() {
        return initialized;
    }

    public void sendPush(String fcmToken, String title, String body) {
        if (fcmToken == null || fcmToken.isBlank()) {
            log.warn("FCM token is empty — skipping push notification");
            return;
        }

        if (!initialized || fcmToken.startsWith("mock-fcm-token")) {
            log.info("[FCM PUSH SIMULATION] Token: {} - Title: {} - Body: {}", fcmToken, title, body);
            return;
        }

        try {
            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            log.info("Successfully sent FCM message: {}", response);
        } catch (Exception e) {
            log.error("Failed to send FCM push notification: {}", e.getMessage());
        }
    }
}
