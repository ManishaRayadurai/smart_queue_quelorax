package com.quelorax.backend.service;

import com.quelorax.backend.dto.request.NotificationCreateRequest;
import com.quelorax.backend.entity.Notification;
import com.quelorax.backend.repository.NotificationRepository;
import com.quelorax.backend.repository.UserRepository;
import com.quelorax.backend.repository.QueueTokenRepository;
import com.quelorax.backend.repository.FcmTokenRepository;
import com.quelorax.backend.entity.QueueToken;
import com.quelorax.backend.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository repository;
    private final UserRepository userRepository;
    private final SmsOtpService smsOtpService;
    private final QueueTokenRepository queueTokenRepository;
    private final FcmTokenRepository fcmTokenRepository;
    private final FcmService fcmService;

    public NotificationService(NotificationRepository repository, UserRepository userRepository, SmsOtpService smsOtpService,
                               QueueTokenRepository queueTokenRepository, FcmTokenRepository fcmTokenRepository, FcmService fcmService) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.smsOtpService = smsOtpService;
        this.queueTokenRepository = queueTokenRepository;
        this.fcmTokenRepository = fcmTokenRepository;
        this.fcmService = fcmService;
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
        // 1. Send SMS (if user has a phone)
        userRepository.findById(uId).ifPresent(user -> {
            if (user.getPhone() != null && !user.getPhone().isBlank()) {
                String smsContent = "[" + title + "] " + body;
                smsOtpService.sendSms(user.getPhone(), smsContent);
            }
        });
        
        // 2. Send FCM Push Notification (to all registered user devices)
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
            userRepository.findAll().forEach(user -> {
                sendNotificationToUser(user.getId(), saved.getTitle(), saved.getMessage());
            });
        } else if (saved.getScope() == Notification.Scope.role && saved.getRole() != null) {
            try {
                User.Role targetRole = User.Role.valueOf(saved.getRole().toUpperCase());
                userRepository.findByRole(targetRole).forEach(user -> {
                    sendNotificationToUser(user.getId(), saved.getTitle(), saved.getMessage());
                });
            } catch (Exception e) {
                userRepository.findAll().forEach(user -> {
                    if (user.getRole().name().equalsIgnoreCase(saved.getRole())) {
                        sendNotificationToUser(user.getId(), saved.getTitle(), saved.getMessage());
                    }
                });
            }
        } else if (saved.getScope() == Notification.Scope.department && saved.getDepartmentId() != null) {
            java.util.Set<Long> notifiedUserIds = new java.util.HashSet<>();
            queueTokenRepository.findByDepartmentId(saved.getDepartmentId()).forEach(token -> {
                boolean isActive = token.getStatus() == QueueToken.Status.waiting 
                        || token.getStatus() == QueueToken.Status.serving
                        || token.getStatus() == QueueToken.Status.delayed
                        || token.getStatus() == QueueToken.Status.missed;
                if (isActive && token.getUserId() != null) {
                    notifiedUserIds.add(token.getUserId());
                }
            });
            notifiedUserIds.forEach(uId -> {
                sendNotificationToUser(uId, saved.getTitle(), saved.getMessage());
            });
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
}
