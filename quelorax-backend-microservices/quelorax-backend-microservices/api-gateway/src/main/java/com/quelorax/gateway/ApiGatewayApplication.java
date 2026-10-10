package com.quelorax.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * api-gateway — the single public entry point for the whole system (port
 * 8080, same as the old monolith). Routes each "/api/..." path to whichever
 * microservice owns it. The frontend's VITE_API_URL and the Postman
 * environment's base_url both still point at http://localhost:8080 —
 * nothing on the client side needed to change.
 *
 * "/api/internal/**" is deliberately NOT routed here — see
 * InternalUserController (auth-service) and InternalTokenController
 * (queue-service) for why that matters.
 */
@SpringBootApplication
public class ApiGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
