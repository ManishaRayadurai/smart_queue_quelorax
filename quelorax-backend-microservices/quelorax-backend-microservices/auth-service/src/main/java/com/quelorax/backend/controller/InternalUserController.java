package com.quelorax.backend.controller;

import com.quelorax.backend.entity.User;
import com.quelorax.backend.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Service-to-service (east-west) API — NOT exposed to the outside world.
 *
 * The api-gateway only proxies "/api/**" paths that are explicitly routed in
 * its RouteLocator config, and "/api/internal/**" is deliberately left out
 * of every route, so this controller is only reachable by other backend
 * services calling auth-service directly on its internal port (8081), never
 * through the public gateway on 8080. This is how notification-service
 * looks up a user's phone number (for SMS) or fans a broadcast out to
 * "all users" / "all users with role X" without owning the users table
 * itself — each service still owns its own data, notification-service just
 * asks the service that owns it.
 *
 * In a production deployment you'd additionally lock this down at the
 * network layer (private subnet / service mesh) or with a shared internal
 * API key — see README-MICROSERVICES.md.
 */
@RestController
@RequestMapping("/api/internal/users")
public class InternalUserController {

    private final UserService service;

    public InternalUserController(UserService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public User getOne(@PathVariable Long id) {
        return service.getOrThrow(id);
    }

    @GetMapping
    public List<User> getAll() {
        return service.getAll();
    }

    @GetMapping("/role/{role}")
    public List<User> getByRole(@PathVariable String role) {
        try {
            User.Role r = User.Role.valueOf(role.toUpperCase());
            return service.getAll().stream().filter(u -> u.getRole() == r).toList();
        } catch (IllegalArgumentException e) {
            return List.of();
        }
    }
}
