package com.quelorax.backend.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Sends branded HTML OTP emails via SMTP using Spring's JavaMailSender.
 */
@Service
public class EmailOtpService {

    private static final Logger log = LoggerFactory.getLogger(EmailOtpService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@quelorax.app}")
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
     * Sends a rich, branded HTML verification email to the user's inbox.
     */
    public void sendOtp(String toEmail, String otp, String purposeLabel) {
        if (!isConfigured()) {
            log.warn("SMTP not configured (spring.mail.username is empty) — skipping OTP email to {}", toEmail);
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(new InternetAddress(fromAddress, "Quelorax Security"));
            helper.setTo(toEmail);
            helper.setSubject("🔒 Quelorax Security Verification Code: " + otp);

            String htmlContent = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; padding: 40px 10px;">
                    <tr>
                        <td align="center">
                            <table role="presentation" width="100%" style="max-width: 520px; background-color:#ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
                                
                                <!-- Header Banner -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #4f46e5 0%, #0284c7 100%); padding: 32px 24px; text-align: center;">
                                        <div style="display: inline-block; background-color: rgba(255,255,255,0.2); padding: 8px 18px; border-radius: 30px; margin-bottom: 12px;">
                                            <span style="color: #ffffff; font-weight: 800; font-size: 18px; letter-spacing: 1.5px;">✨ QUELORAX</span>
                                        </div>
                                        <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0;">Security Verification Code</h1>
                                        <p style="color: #e0f2fe; font-size: 13px; margin-top: 6px; margin-bottom: 0;">Smart Queue Management System</p>
                                    </td>
                                </tr>
                                
                                <!-- Body Content -->
                                <tr>
                                    <td style="padding: 32px 28px; text-align: cen                                        <p style="color: #475569; font-size: 15px; margin: 0; line-height: 1.5;">
                                            Hello! Please use the verification code below to complete your <strong style="color:#1e293b;">%s</strong>:
                                        </p>
                                        
                                        <!-- OTP Box -->
                                        <div style="margin: 28px 0; background-color: #f1f5f9; border: 2px dashed #4f46e5; border-radius: 16px; padding: 20px; text-align: center;">
                                            <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #4f46e5; letter-spacing: 8px; display: inline-block;">
                                                %s
                                            </span>
                                        </div>
                                        
                                        <!-- Timer Notice -->
                                        <div style="background-color: #fffbeb; border-radius: 12px; border: 1px solid #fef3c7; padding: 12px 16px; text-align: left; margin-bottom: 24px;">
                                            <p style="color: #b45309; font-size: 13px; font-weight: 600; margin: 0;">
                                                ⏱️ Valid for 10 minutes
                                            </p>
                                            <p style="color: #d97706; font-size: 11px; margin: 4px 0 0 0;">
                                                For security reasons, do not share this code with anyone.
                                            </p>
                                        </div>
                                        
                                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                                            If you did not request this code, you can safely ignore this email.
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
                                        <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                                            © 2026 Quelorax Queue Management System. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                                
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(purposeLabel, otp);

            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
            log.info("Branded HTML OTP email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send HTML OTP email to {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to send verification email: " + e.getMessage());
        }
    }
}
