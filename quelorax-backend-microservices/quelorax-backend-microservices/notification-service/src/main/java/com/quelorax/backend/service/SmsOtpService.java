package com.quelorax.backend.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Sends OTP codes by real SMS via Twilio.
 * Configure app.twilio.* in application.properties (or TWILIO_ACCOUNT_SID /
 * TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER env vars). If not configured, sending is
 * skipped and a warning is logged server-side — the code is never exposed to the client.
 */
@Service
public class SmsOtpService {

    private static final Logger log = LoggerFactory.getLogger(SmsOtpService.class);

    @Value("${app.twilio.account-sid:}")
    private String accountSid;

    @Value("${app.twilio.auth-token:}")
    private String authToken;

    @Value("${app.twilio.from-number:}")
    private String fromNumber;

    @PostConstruct
    public void init() {
        if (isConfigured()) {
            Twilio.init(accountSid, authToken);
        } else {
            log.warn("Twilio not configured (app.twilio.account-sid/auth-token/from-number empty) — SMS OTP sending is disabled");
        }
    }

    public boolean isConfigured() {
        return notBlank(accountSid) && notBlank(authToken) && notBlank(fromNumber);
    }

    private boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    public void sendSms(String toPhone, String messageText) {
        if (!notBlank(toPhone)) {
            log.warn("No phone number to send SMS");
            return;
        }
        if (!isConfigured()) {
            log.info("[SMS SIMULATION] To: {} - Message: {}", toPhone, messageText);
            return;
        }
        try {
            Message.creator(
                    new PhoneNumber(toPhone),
                    new PhoneNumber(fromNumber),
                    messageText
            ).create();
            log.info("SMS sent to {}", toPhone);
        } catch (Exception e) {
            log.error("Failed to send SMS to {}: {}", toPhone, e.getMessage());
        }
    }

    /**
     * Sends the OTP to the given E.164 phone number (e.g. +919876543210).
     * No-ops (with a log warning) if Twilio isn't configured or no phone is on file.
     */
    public void sendOtp(String toPhone, String otp, String purposeLabel) {
        String msg = "Your Quelorax " + purposeLabel + " code is: " + otp;
        sendSms(toPhone, msg);
    }
}
