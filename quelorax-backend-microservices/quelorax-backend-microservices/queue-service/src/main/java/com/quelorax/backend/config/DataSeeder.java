package com.quelorax.backend.config;

import com.quelorax.backend.entity.Department;
import com.quelorax.backend.repository.DepartmentRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Seeds queue-service's own tables only (departments). Seeded first so it
 * lands on id=1 ("General Enquiry"), which auth-service's DataSeeder
 * assumes when it assigns the demo STAFF account to a department — see the
 * note in auth-service's DataSeeder.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;

    public DataSeeder(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @Override
    public void run(String... args) {
        if (departmentRepository.count() == 0) {
            departmentRepository.save(Department.builder()
                    .name("General Enquiry").code("GEN").avgServiceTime(6).counter(1).active(true).build());
            departmentRepository.save(Department.builder()
                    .name("Account Services").code("ACC").avgServiceTime(10).counter(2).active(true).build());
            departmentRepository.save(Department.builder()
                    .name("Document Verification").code("DOC").avgServiceTime(8).counter(3).active(true).build());
        }
    }
}
