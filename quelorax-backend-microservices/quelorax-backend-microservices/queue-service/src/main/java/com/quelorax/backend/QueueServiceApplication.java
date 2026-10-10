package com.quelorax.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * queue-service — owns Departments, Queue Tokens, and Documents. Port 8082.
 * See README-MICROSERVICES.md at the repo root.
 */
@SpringBootApplication
public class QueueServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(QueueServiceApplication.class, args);
    }
}
