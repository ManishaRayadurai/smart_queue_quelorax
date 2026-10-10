package com.quelorax.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "departments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String code;

    @Builder.Default
    private int avgServiceTime = 5;

    @Builder.Default
    private int counter = 1;

    @Builder.Default
    private boolean active = true;
}
