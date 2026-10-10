package com.quelorax.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "organization")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String tagline;
    private Long createdAt;
}
