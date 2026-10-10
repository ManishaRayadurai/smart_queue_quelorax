package com.quelorax.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId; // nullable - targeted notification

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Scope scope = Scope.user; // user | org | department | role

    private Long departmentId; // used when scope == department
    private String role;       // used when scope == role

    @Builder.Default
    private String type = "info";

    private String title;

    @Column(length = 2000)
    private String message;

    private Long createdAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "notification_read_by", joinColumns = @JoinColumn(name = "notification_id"))
    @Column(name = "user_id")
    @Builder.Default
    private Set<Long> readBy = new HashSet<>();

    public enum Scope { user, org, department, role }
}
