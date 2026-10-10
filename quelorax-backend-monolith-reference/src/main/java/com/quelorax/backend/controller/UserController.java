package com.quelorax.backend.controller;

import com.quelorax.backend.dto.request.UserCreateRequest;
import com.quelorax.backend.dto.response.LoginStatsResponse;
import com.quelorax.backend.entity.User;
import com.quelorax.backend.filter.JwtAuthFilter;
import com.quelorax.backend.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    public List<User> getAll() {
        return service.getAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public User create(@RequestBody UserCreateRequest req) {
        return service.createByAdmin(req);
    }

    @GetMapping("/me")
    public User me(Authentication auth) {
        JwtAuthFilter.AuthenticatedUser principal = (JwtAuthFilter.AuthenticatedUser) auth.getPrincipal();
        return service.getOrThrow(principal.userId());
    }

    @GetMapping("/{id}")
    public User getOne(@PathVariable Long id) {
        return service.getOrThrow(id);
    }

    @PutMapping("/{id}")
    public User update(@PathVariable Long id, @RequestBody User patch) {
        return service.update(id, patch);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @GetMapping("/stats/login")
    @PreAuthorize("hasRole('ADMIN')")
    public LoginStatsResponse loginStats() {
        return service.getLoginStats();
    }

    @PostMapping("/fcm-token")
    public void registerFcmToken(Authentication auth, @RequestBody java.util.Map<String, String> body) {
        JwtAuthFilter.AuthenticatedUser principal = (JwtAuthFilter.AuthenticatedUser) auth.getPrincipal();
        String token = body.get("token");
        service.registerFcmToken(principal.userId(), token);
    }

    @PostMapping("/fcm-token/unregister")
    public void unregisterFcmToken(@RequestBody java.util.Map<String, String> body) {
        String token = body.get("token");
        service.unregisterFcmToken(token);
    }
}
