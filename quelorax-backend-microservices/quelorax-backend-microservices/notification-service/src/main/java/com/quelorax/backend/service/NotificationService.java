package com.quelorax.backend.service;

import com.quelorax.backend.dto.request.NotificationCreateRequest;
import com.quelorax.backend.entity.Notification;
import com.quelorax.backend.repository.NotificationRepository;
import com.quelorax.backend.repository.FcmTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Notification-service does NOT own users or queue tokens — auth-service and
 * queue-service do. Where the monolith used to reach across via
 * UserRepository / QueueTokenRepository, this now calls those services'
 * internal (gateway-unreachable) APIs instead. See InternalUserController
 * and InternalTokenController.
 */
@Service
public class NotificationService {

    private final NotificationRepository repository;
    private final SmsOtpService smsOtpService;
    private final FcmTokenRepository fcmTokenRepository;
    private final FcmService fcmService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.services.auth-url}")
    private String authServiceUrl;

    @Value("${app.services.queue-url}")
    private String queueServiceUrl;

    public NotificationService(NotificationRepository repository, SmsOtpService smsOtpService,
                                FcmTokenRepository fcmTokenRepository, FcmService fcmService) {
        this.repository = repository;
        this.smsOtpService = smsOtpService;
        this.fcmTokenRepository = fcmTokenRepository;
        this.fcmService = fcmService;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchUser(Long userId) {
        try {
            return restTemplate.getForObject(authServiceUrl + "/api/internal/users/" + userId, Map.class);
        } catch (RestClientException e) {
            return null; // auth-service unreachable or user gone — skip this recipient rather than fail the whole broadcast
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchAllUsers() {
        try {
            return restTemplate.getForObject(authServiceUrl + "/api/internal/users", List.class);
        } catch (RestClientException e) {
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchUsersByRole(String role) {
        try {
            return restTemplate.getForObject(authServiceUrl + "/api/internal/users/role/" + role, List.class);
        } catch (RestClientException e) {
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchDepartmentTokens(Long departmentId) {
        try {
            List<Map<String, Object>> result = restTemplate.getForObject(
                    queueServiceUrl + "/api/internal/tokens/department/" + departmentId, List.class);
            return result != null ? result : List.of();
        } catch (RestClientException e) {
            return List.of();
        }
    }

    @Transactional(readOnly = true)
    public List<Notification> getForUser(Long userId, String role, Long departmentId) {
        return repository.findAll().stream()
                .filter(n -> {
                    Notification.Scope scope = n.getScope() != null ? n.getScope() : Notification.Scope.user;
                    if (n.getUserId() != null && n.getUserId().equals(userId)) return true;
                    if (scope == Notification.Scope.org) return true;
                    if (scope == Notification.Scope.department
                            && n.getDepartmentId() != null && n.getDepartmentId().equals(departmentId)) return true;
                    if (scope == Notification.Scope.role
                            && role != null && role.equalsIgnoreCase(n.getRole())) return true;
                    return false;
                })
                .toList();
    }

    private void sendNotificationToUser(Long uId, String title, String body) {
        // 1. Send SMS (if user has a phone) — looked up from auth-service, which owns the users table.
        Map<String, Object> user = fetchUser(uId);
        if (user != null) {
            Object phone = user.get("phone");
            if (phone instanceof String p && !p.isBlank()) {
                String smsContent = "[" + title + "] " + body;
                smsOtpService.sendSms(p, smsContent);
            }
        }

        // 2. Send FCM Push Notification (to all registered user devices) — owned locally by notification-service.
        fcmTokenRepository.findByUserId(uId).forEach(fcmToken -> {
            fcmService.sendPush(fcmToken.getToken(), title, body);
        });
    }

    public Notification create(NotificationCreateRequest req) {
        Notification n = Notification.builder()
                .userId(req.getUserId())
                .scope(req.getScope() != null ? Notification.Scope.valueOf(req.getScope()) : Notification.Scope.user)
                .departmentId(req.getDepartmentId())
                .role(req.getRole())
                .type(req.getType() != null ? req.getType() : "info")
                .title(req.getTitle())
                .message(req.getMessage())
                .createdAt(System.currentTimeMillis())
                .build();

        Notification saved = repository.save(n);

        if (saved.getScope() == Notification.Scope.user && req.getUserId() != null) {
            sendNotificationToUser(req.getUserId(), saved.getTitle(), saved.getMessage());
        } else if (saved.getScope() == Notification.Scope.org) {
            fetchAllUsers().forEach(user -> {
                Object id = user.get("id");
                if (id != null) sendNotificationToUser(Long.valueOf(String.valueOf(id)), saved.getTitle(), saved.getMessage());
            });
        } else if (saved.getScope() == Notification.Scope.role && saved.getRole() != null) {
            fetchUsersByRole(saved.getRole()).forEach(user -> {
                Object id = user.get("id");
                if (id != null) sendNotificationToUser(Long.valueOf(String.valueOf(id)), saved.getTitle(), saved.getMessage());
            });
        } else if (saved.getScope() == Notification.Scope.department && saved.getDepartmentId() != null) {
            java.util.Set<Long> notifiedUserIds = new java.util.HashSet<>();
            fetchDepartmentTokens(saved.getDepartmentId()).forEach(token -> {
                Object statusObj = token.get("status");
                String status = statusObj != null ? String.valueOf(statusObj) : "";
                boolean isActive = status.equals("waiting") || status.equals("serving")
                        || status.equals("delayed") || status.equals("missed");
                Object userIdObj = token.get("userId");
                if (isActive && userIdObj != null) {
                    notifiedUserIds.add(Long.valueOf(String.valueOf(userIdObj)));
                }
            });
            notifiedUserIds.forEach(uId -> sendNotificationToUser(uId, saved.getTitle(), saved.getMessage()));
        }

        return saved;
    }

    @Transactional
    public void markRead(Long id, Long userId) {
        repository.findById(id).ifPresent(n -> {
            n.getReadBy().add(userId);
            repository.save(n);
        });
    }

    @Transactional
    public void markAllRead(Long userId, String role, Long departmentId) {
        List<Notification> applicable = getForUser(userId, role, departmentId);
        applicable.forEach(n -> n.getReadBy().add(userId));
        repository.saveAll(applicable);
    }

    @Transactional
    public void registerFcmToken(Long userId, String token) {
        if (token == null || token.isBlank()) return;
        fcmTokenRepository.findByToken(token).ifPresentOrElse(existing -> {
            if (!existing.getUserId().equals(userId)) {
                existing.setUserId(userId);
                existing.setCreatedAt(System.currentTimeMillis());
                fcmTokenRepository.save(existing);
            }
        }, () -> fcmTokenRepository.save(com.quelorax.backend.entity.FcmToken.builder()
                .userId(userId)
                .token(token)
                .createdAt(System.currentTimeMillis())
                .build()));
    }

    @Transactional
    public void unregisterFcmToken(String token) {
        if (token == null || token.isBlank()) return;
        fcmTokenRepository.findByToken(token).ifPresent(fcmTokenRepository::delete);
    }
}
