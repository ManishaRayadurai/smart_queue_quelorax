package com.quelorax.backend.service;

import com.quelorax.backend.dto.request.UserCreateRequest;
import com.quelorax.backend.dto.response.LoginStatsResponse;
import com.quelorax.backend.entity.User;
import com.quelorax.backend.entity.FcmToken;
import com.quelorax.backend.exception.ApiException;
import com.quelorax.backend.repository.UserRepository;
import com.quelorax.backend.repository.FcmTokenRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final FcmTokenRepository fcmTokenRepository;
    private static final long ONLINE_WINDOW_MS = 15 * 60 * 1000;

    public UserService(UserRepository repository, PasswordEncoder passwordEncoder, FcmTokenRepository fcmTokenRepository) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.fcmTokenRepository = fcmTokenRepository;
    }

    public User createByAdmin(UserCreateRequest req) {
        if (repository.existsByEmailIgnoreCase(req.getEmail())) {
            throw new ApiException("Email already registered", HttpStatus.CONFLICT);
        }
        User.Role role;
        try {
            role = User.Role.valueOf(req.getRole().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ApiException("Invalid role: " + req.getRole(), HttpStatus.BAD_REQUEST);
        }
        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(role)
                .departmentId(role == User.Role.STAFF ? req.getDepartmentId() : null)
                .verified(true) // admin-created accounts don't need email verification
                .createdAt(System.currentTimeMillis())
                .loginCount(0)
                .build();
        User saved = repository.save(user);
        saved.setPassword(null);
        return saved;
    }

    public List<User> getAll() {
        List<User> users = repository.findAll();
        users.forEach(u -> u.setPassword(null));
        return users;
    }

    public User getOrThrow(Long id) {
        User u = repository.findById(id)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
        u.setPassword(null);
        return u;
    }

    public User update(Long id, User patch) {
        User u = repository.findById(id)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
        if (patch.getName() != null) u.setName(patch.getName());
        if (patch.getPhone() != null) u.setPhone(patch.getPhone());
        if (patch.getRole() != null) u.setRole(patch.getRole());
        if (patch.getDepartmentId() != null) u.setDepartmentId(patch.getDepartmentId());
        if (patch.getPassword() != null && !patch.getPassword().isBlank()) {
            u.setPassword(passwordEncoder.encode(patch.getPassword()));
        }
        User saved = repository.save(u);
        saved.setPassword(null);
        return saved;
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public LoginStatsResponse getLoginStats() {
        List<User> users = repository.findAll();
        long now = System.currentTimeMillis();
        long usersLoggedIn = users.stream().filter(u -> u.getLoginCount() > 0).count();
        long onlineNow = users.stream()
                .filter(u -> u.getLastLoginAt() != null && (now - u.getLastLoginAt()) <= ONLINE_WINDOW_MS)
                .count();
        long totalLogins = users.stream().mapToLong(User::getLoginCount).sum();
        return new LoginStatsResponse(users.size(), usersLoggedIn, onlineNow, totalLogins);
    }

    @Transactional
    public void registerFcmToken(Long userId, String token) {
        if (token == null || token.isBlank()) return;
        
        java.util.Optional<FcmToken> existingOpt = fcmTokenRepository.findByToken(token);
        if (existingOpt.isPresent()) {
            FcmToken existing = existingOpt.get();
            if (existing.getUserId().equals(userId)) {
                // Token is already registered for this user, do nothing.
                return;
            } else {
                // Token belongs to a different user, update ownership.
                existing.setUserId(userId);
                existing.setCreatedAt(System.currentTimeMillis());
                fcmTokenRepository.save(existing);
            }
        } else {
            // Register new token.
            fcmTokenRepository.save(FcmToken.builder()
                    .userId(userId)
                    .token(token)
                    .createdAt(System.currentTimeMillis())
                    .build());
        }
    }

    @Transactional
    public void unregisterFcmToken(String token) {
        if (token == null || token.isBlank()) return;
        fcmTokenRepository.findByToken(token).ifPresent(fcmTokenRepository::delete);
    }
}
