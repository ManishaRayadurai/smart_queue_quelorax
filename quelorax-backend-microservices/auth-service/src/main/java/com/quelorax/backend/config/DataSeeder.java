package com.quelorax.backend.config;

import com.quelorax.backend.entity.*;
import com.quelorax.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds auth-service's own tables only (users, organization, settings).
 * Departments now live in queue-service's own DataSeeder and are seeded
 * independently — the very first department created there ("General
 * Enquiry") is expected to land on id=1, which is what the seeded STAFF
 * account below is assigned to. In a real deployment you'd look this up via
 * queue-service's API instead of assuming the id; this demo seed data
 * keeps it simple since both seeders run against fresh, empty databases.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final SettingsRepository settingsRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                       OrganizationRepository organizationRepository,
                       SettingsRepository settingsRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.settingsRepository = settingsRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (organizationRepository.count() == 0) {
            organizationRepository.save(Organization.builder()
                    .name("Quelorax Organization")
                    .tagline("Any walk-in organization")
                    .createdAt(System.currentTimeMillis())
                    .build());
        }

        if (settingsRepository.count() == 0) {
            settingsRepository.save(Settings.builder().theme("light").language("en").build());
        }

        if (userRepository.count() == 0) {
            userRepository.save(User.builder()
                    .name("System Admin").email("admin@quelorax.app").phone("+10000000001")
                    .password(passwordEncoder.encode("admin123"))
                    .role(User.Role.ADMIN).verified(true).createdAt(System.currentTimeMillis())
                    .loginCount(0).build());

            userRepository.save(User.builder()
                    .name("Reception Desk").email("reception@quelorax.app").phone("+10000000002")
                    .password(passwordEncoder.encode("reception123"))
                    .role(User.Role.RECEPTIONIST).verified(true).createdAt(System.currentTimeMillis())
                    .loginCount(0).build());

            userRepository.save(User.builder()
                    .name("Staff Member").email("staff@quelorax.app").phone("+10000000003")
                    .password(passwordEncoder.encode("staff123"))
                    .role(User.Role.STAFF).departmentId(1L)
                    .verified(true).createdAt(System.currentTimeMillis())
                    .loginCount(0).build());
        }
    }
}
