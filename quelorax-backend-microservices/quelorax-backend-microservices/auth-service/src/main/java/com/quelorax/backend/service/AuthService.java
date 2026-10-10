package com.quelorax.backend.service;

import com.quelorax.backend.dto.request.*;
import com.quelorax.backend.dto.response.AuthResponse;
import com.quelorax.backend.entity.OtpCode;
import com.quelorax.backend.entity.User;
import com.quelorax.backend.exception.ApiException;
import com.quelorax.backend.repository.OtpCodeRepository;
import com.quelorax.backend.repository.UserRepository;
import com.quelorax.backend.dto.request.GoogleAuthRequest;
import com.quelorax.backend.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OtpCodeRepository otpCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpDeliveryService otpDeliveryService;
    private final GoogleTokenVerifier googleTokenVerifier;

    private static final long OTP_EXPIRY_MS = 5 * 60 * 1000;       // 5 minutes for login/register OTP
    private static final long RESET_EXPIRY_MS = 15 * 60 * 1000;    // 15 minutes for password reset OTP
    private static final SecureRandom RANDOM = new SecureRandom();

    public AuthService(UserRepository userRepository, OtpCodeRepository otpCodeRepository,
                        PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
                        OtpDeliveryService otpDeliveryService, GoogleTokenVerifier googleTokenVerifier) {
        this.userRepository = userRepository;
        this.otpCodeRepository = otpCodeRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.otpDeliveryService = otpDeliveryService;
        this.googleTokenVerifier = googleTokenVerifier;
    }

    private String generateOtp() {
        return String.valueOf(100000 + RANDOM.nextInt(900000));
    }

    // --- Register ---
    @Transactional
    public void register(RegisterRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.getEmail())) {
            throw new ApiException("Email already registered", HttpStatus.CONFLICT);
        }
        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(User.Role.VISITOR)
                .verified(false)
                .createdAt(System.currentTimeMillis())
                .loginCount(0)
                .build();
        userRepository.save(user);

        String otp = generateOtp();
        saveOtp(req.getEmail(), otp, OtpCode.Purpose.REGISTER, OTP_EXPIRY_MS);
        // Real delivery only — the code is never returned in the API response.
        // If neither channel can deliver it, this throws and the transaction rolls back.
        otpDeliveryService.deliver(req.getEmail(), req.getPhone(), otp, "account verification");
    }

    // Re-sends a fresh registration OTP for a signup that's already been
    // started but not yet verified. Calling register() again for this would
    // fail with "Email already registered" (that check exists to stop
    // someone re-registering an email that's already active) — this is the
    // separate path for "I didn't get the code / it expired, send another".
    @Transactional
    public void resendRegistrationOtp(EmailRequest req) {
        User user = userRepository.findByEmailIgnoreCase(req.getEmail())
                .orElseThrow(() -> new ApiException(
                        "No pending registration found for this email. Please register again.", HttpStatus.NOT_FOUND));
        if (user.isVerified()) {
            throw new ApiException(
                    "This email is already verified — please log in instead.", HttpStatus.CONFLICT);
        }
        String otp = generateOtp();
        saveOtp(user.getEmail(), otp, OtpCode.Purpose.REGISTER, OTP_EXPIRY_MS);
        otpDeliveryService.deliver(user.getEmail(), user.getPhone(), otp, "account verification");
    }

    @Transactional
    public AuthResponse verifyRegistration(OtpVerifyRequest req) {
        if (!verifyOtp(req.getEmail(), req.getOtp(), OtpCode.Purpose.REGISTER)) {
            throw new ApiException("Invalid or expired code", HttpStatus.BAD_REQUEST);
        }
        User user = findByEmailOrThrow(req.getEmail());
        user.setVerified(true);
        recordLogin(user);
        return buildAuthResponse(user);
    }

    // --- Login (password) ---
    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = findByEmailOrThrow(req.getEmail());
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new ApiException("Incorrect password", HttpStatus.UNAUTHORIZED);
        }
        if (!user.isVerified()) {
            throw new ApiException("Please verify your email first", HttpStatus.FORBIDDEN);
        }
        recordLogin(user);
        return buildAuthResponse(user);
    }

    // --- Login (OTP) ---
    @Transactional
    public void requestLoginOtp(EmailRequest req) {
        User user = findByEmailOrThrow(req.getEmail());
        String otp = generateOtp();
        saveOtp(user.getEmail(), otp, OtpCode.Purpose.LOGIN, OTP_EXPIRY_MS);
        otpDeliveryService.deliver(user.getEmail(), user.getPhone(), otp, "login");
    }

    @Transactional
    public AuthResponse loginWithOtp(OtpVerifyRequest req) {
        if (!verifyOtp(req.getEmail(), req.getOtp(), OtpCode.Purpose.LOGIN)) {
            throw new ApiException("Invalid or expired code", HttpStatus.BAD_REQUEST);
        }
        User user = findByEmailOrThrow(req.getEmail());
        user.setVerified(true);
        recordLogin(user);
        return buildAuthResponse(user);
    }

    // --- Google sign-in / sign-up ---
    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest req) {
        GoogleTokenVerifier.GoogleProfile profile = googleTokenVerifier.verify(req.getCredential());

        User user = userRepository.findByEmailIgnoreCase(profile.email).orElse(null);
        if (user == null) {
            // First time signing in with this Google account — auto-create a
            // verified visitor account. Google already verified the email, so
            // no OTP step is needed. The password is a random value the user
            // will never see or need (they always sign in via Google or reset
            // it themselves), it just satisfies the non-null column.
            user = User.builder()
                    .name(profile.name)
                    .email(profile.email)
                    .password(passwordEncoder.encode(RANDOM_TOKEN()))
                    .role(User.Role.VISITOR)
                    .verified(true)
                    .createdAt(System.currentTimeMillis())
                    .loginCount(0)
                    .build();
            userRepository.save(user);
        } else if (!user.isVerified()) {
            user.setVerified(true);
        }

        recordLogin(user);
        return buildAuthResponse(user);
    }

    private String RANDOM_TOKEN() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return java.util.Base64.getEncoder().encodeToString(bytes);
    }

    // --- Forgot / reset password ---
    @Transactional
    public void requestPasswordReset(EmailRequest req) {
        User user = findByEmailOrThrow(req.getEmail());
        String otp = generateOtp();
        saveOtp(user.getEmail(), otp, OtpCode.Purpose.RESET, RESET_EXPIRY_MS);
        otpDeliveryService.deliver(user.getEmail(), user.getPhone(), otp, "password reset");
    }

    @Transactional
    public AuthResponse confirmPasswordReset(ResetPasswordRequest req) {
        if (!verifyOtp(req.getEmail(), req.getOtp(), OtpCode.Purpose.RESET)) {
            throw new ApiException("Invalid or expired code", HttpStatus.BAD_REQUEST);
        }
        User user = findByEmailOrThrow(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setVerified(true);
        recordLogin(user);
        return buildAuthResponse(user);
    }

    // --- helpers ---
    private User findByEmailOrThrow(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException("No account with this email", HttpStatus.NOT_FOUND));
    }

    private void saveOtp(String email, String code, OtpCode.Purpose purpose, long expiryMs) {
        otpCodeRepository.deleteByEmailIgnoreCaseAndPurpose(email, purpose);
        otpCodeRepository.save(OtpCode.builder()
                .email(email.toLowerCase())
                .code(code)
                .purpose(purpose)
                .expiresAt(System.currentTimeMillis() + expiryMs)
                .build());
    }

    private boolean verifyOtp(String email, String code, OtpCode.Purpose purpose) {
        var entryOpt = otpCodeRepository.findTopByEmailIgnoreCaseAndPurposeOrderByIdDesc(email, purpose);
        if (entryOpt.isEmpty()) return false;
        OtpCode entry = entryOpt.get();
        if (entry.getExpiresAt() < System.currentTimeMillis()) return false;
        if (!entry.getCode().equals(code)) return false;
        otpCodeRepository.delete(entry);
        return true;
    }

    private void recordLogin(User user) {
        user.setLastLoginAt(System.currentTimeMillis());
        user.setLoginCount(user.getLoginCount() + 1);
        userRepository.save(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user); // password is never serialized, thanks to @JsonIgnore on User.password
    }
}
