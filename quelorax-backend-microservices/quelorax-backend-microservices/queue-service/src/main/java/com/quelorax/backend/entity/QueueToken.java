package com.quelorax.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "queue_tokens")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class QueueToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;   // e.g. GEN-003
    private int number;    // sequence number for the day within department

    private Long userId;   // visitor's user id (nullable for walk-ins with no account)
    private String visitorName;
    private String phone;

    @Column(nullable = false)
    private Long departmentId;

    private String purpose;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Priority priority = Priority.normal;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.waiting;

    @Builder.Default
    private boolean walkIn = false;

    private Long slotTime;      // preferred arrival time (epoch ms), null = ASAP
    private Long orderKey;      // controls manual position within a priority tier

    private Long createdAt;
    private Long calledAt;
    private Long completedAt;
    private Long checkedInAt;
    private Long cancelledAt;

    private Long delayUntil;
    private String delayNote;

    public enum Priority { normal, senior, emergency, vip }
    public enum Status { waiting, serving, completed, skipped, cancelled, delayed, missed }
}
