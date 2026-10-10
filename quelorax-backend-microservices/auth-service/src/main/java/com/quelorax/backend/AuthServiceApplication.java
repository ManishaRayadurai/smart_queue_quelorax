package com.quelorax.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * auth-service — owns Users, Organization profile, Settings, and OTP /
 * Google sign-in. Port 8081. See README-MICROSERVICES.md at the repo root.
 */
@SpringBootApplication
public class AuthServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
