package com.quelorax.backend.config;

import com.quelorax.backend.entity.*;
import com.quelorax.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final OrganizationRepository organizationRepository;
    private final SettingsRepository settingsRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                       DepartmentRepository departmentRepository,
                       OrganizationRepository organizationRepository,
                       SettingsRepository settingsRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
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

        Department genDept = null;
        if (departmentRepository.count() == 0) {
            genDept = departmentRepository.save(Department.builder()
                    .name("General Enquiry").code("GEN").avgServiceTime(6).counter(1).active(true).build());
            departmentRepository.save(Department.builder()
                    .name("Account Services").code("ACC").avgServiceTime(10).counter(2).active(true).build());
            departmentRepository.save(Department.builder()
                    .name("Document Verification").code("DOC").avgServiceTime(8).counter(3).active(true).build());
        } else {
            genDept = departmentRepository.findAll().stream().findFirst().orElse(null);
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
                    .role(User.Role.STAFF).departmentId(genDept != null ? genDept.getId() : null)
                    .verified(true).createdAt(System.currentTimeMillis())
                    .loginCount(0).build());
        }
    }
}
