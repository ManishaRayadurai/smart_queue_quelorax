package com.quelorax.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(unique = true)
    private String phone;

    private String username;

    @Column(columnDefinition = "LONGTEXT")
    private String profileImage;

    @Column(nullable = false)
    @JsonIgnore
    private String password; // BCrypt hashed, never serialized in API responses

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role; // ADMIN, RECEPTIONIST, STAFF, VISITOR

    private Long departmentId; // nullable, only relevant for STAFF

    @Builder.Default
    private boolean verified = false;

    private Long createdAt;
    private Long lastLoginAt;

    @Builder.Default
    private int loginCount = 0;

    public enum Role { ADMIN, RECEPTIONIST, STAFF, VISITOR }
}
