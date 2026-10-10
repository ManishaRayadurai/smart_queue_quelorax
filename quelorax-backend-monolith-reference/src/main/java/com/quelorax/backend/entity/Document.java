package com.quelorax.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "documents")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    private String name;
    private String type;

    @Column(length = 2000)
    private String fileUrl; // path/URL to stored file, or base64 reference

    @Builder.Default
    private String status = "pending"; // pending | approved | rejected

    private Long uploadedAt;
}
