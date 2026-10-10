package com.quelorax.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Sends OTP codes by real email (SMTP), using Spring's JavaMailSender.
 * Configure spring.mail.* in application.properties (or MAIL_HOST / MAIL_USERNAME /
 * MAIL_PASSWORD / MAIL_FROM env vars). If no credentials are configured, sending is
 * skipped and a warning is logged server-side — the code is never exposed to the client.
 */
@Service
public class EmailOtpService {

    private static final Logger log = LoggerFactory.getLogger(EmailOtpService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public EmailOtpService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public boolean isConfigured() {
        return mailUsername != null && !mailUsername.isBlank();
    }

    /**
     * Sends the OTP to the given address. Throws if configured but the send fails,
     * so the caller can decide how to handle a delivery failure.
     */
    public void sendOtp(String toEmail, String otp, String purposeLabel) {
        if (!isConfigured()) {
            log.warn("SMTP not configured (spring.mail.username is empty) — skipping OTP email to {}", toEmail);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Your Quelorax verification code");
        message.setText(
                "Your " + purposeLabel + " verification code is: " + otp + "\n\n" +
                "This code will expire shortly. If you didn't request this, you can safely ignore this email."
        );
        mailSender.send(message);
        log.info("OTP email sent to {}", toEmail);
    }
}
