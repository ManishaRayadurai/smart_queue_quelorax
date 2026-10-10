package com.quelorax.backend.service;

import com.quelorax.backend.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Delivers OTP codes to the user's real email address and phone number.
 * The OTP is NEVER returned to the frontend/API response — it only ever
 * reaches the user through one of these two channels.
 */
@Service
public class OtpDeliveryService {

    private static final Logger log = LoggerFactory.getLogger(OtpDeliveryService.class);

    private final EmailOtpService emailOtpService;
    private final SmsOtpService smsOtpService;

    public OtpDeliveryService(EmailOtpService emailOtpService, SmsOtpService smsOtpService) {
        this.emailOtpService = emailOtpService;
        this.smsOtpService = smsOtpService;
    }

    /**
     * Sends the OTP to both channels (email always, SMS when a phone number is on file).
     * If neither provider is configured, fails loudly instead of silently letting the
     * user through — this keeps a misconfigured deployment from ever "verifying" someone
     * without actually delivering a code.
     */
    public void deliver(String email, String phone, String otp, String purposeLabel) {
        boolean emailAttempted = emailOtpService.isConfigured();
        boolean smsAttempted = smsOtpService.isConfigured() && phone != null && !phone.isBlank();

        boolean emailOk = false;
        boolean smsOk = false;

        if (emailAttempted) {
            try {
                emailOtpService.sendOtp(email, otp, purposeLabel);
                emailOk = true;
            } catch (Exception e) {
                log.error("Failed to send OTP email to {}: {}", email, e.getMessage());
            }
        }

        if (smsAttempted) {
            try {
                smsOtpService.sendOtp(phone, otp, purposeLabel);
                smsOk = true;
            } catch (Exception e) {
                log.error("Failed to send OTP SMS to {}: {}", phone, e.getMessage());
            }
        }

        if (!emailAttempted && !smsAttempted) {
            // Neither provider has credentials configured at all.
            throw new ApiException(
                    "OTP delivery isn't configured on this server. Set MAIL_* and/or TWILIO_* " +
                    "environment variables (see application.properties) so verification codes can be sent.",
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }

        if (!emailOk && !smsOk) {
            // Providers were configured but every send attempt failed.
            throw new ApiException(
                    "We couldn't deliver a verification code to your email or phone right now. Please try again shortly.",
                    HttpStatus.BAD_GATEWAY
            );
        }
    }
}
