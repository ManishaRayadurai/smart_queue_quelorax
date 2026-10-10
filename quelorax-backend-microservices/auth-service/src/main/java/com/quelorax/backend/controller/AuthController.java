package com.quelorax.backend.controller;

import com.quelorax.backend.dto.request.*;
import com.quelorax.backend.dto.response.AuthResponse;
import com.quelorax.backend.dto.response.MessageResponse;
import com.quelorax.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public MessageResponse register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return new MessageResponse("Registered. We've sent a verification code to your email and phone.");
    }

    @PostMapping("/resend-registration-otp")
    public MessageResponse resendRegistrationOtp(@Valid @RequestBody EmailRequest req) {
        authService.resendRegistrationOtp(req);
        return new MessageResponse("We've sent a new verification code to your email and phone.");
    }

    @PostMapping("/verify-registration")
    public AuthResponse verifyRegistration(@Valid @RequestBody OtpVerifyRequest req) {
        return authService.verifyRegistration(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/login-otp/request")
    public MessageResponse requestLoginOtp(@Valid @RequestBody EmailRequest req) {
        authService.requestLoginOtp(req);
        return new MessageResponse("We've sent a login code to your email and phone.");
    }

    @PostMapping("/login-otp/verify")
    public AuthResponse loginWithOtp(@Valid @RequestBody OtpVerifyRequest req) {
        return authService.loginWithOtp(req);
    }

    @PostMapping("/google")
    public AuthResponse googleAuth(@Valid @RequestBody GoogleAuthRequest req) {
        return authService.loginWithGoogle(req);
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody EmailRequest req) {
        authService.requestPasswordReset(req);
        return new MessageResponse("We've sent a password reset code to your email and phone.");
    }

    @PostMapping("/reset-password")
    public AuthResponse resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        return authService.confirmPasswordReset(req);
    }
}
