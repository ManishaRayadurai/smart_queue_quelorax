package com.quelorax.backend.repository;

import com.quelorax.backend.entity.QueueToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QueueTokenRepository extends JpaRepository<QueueToken, Long> {
    List<QueueToken> findByDepartmentId(Long departmentId);
    List<QueueToken> findByUserId(Long userId);
    List<QueueToken> findByDepartmentIdAndStatus(Long departmentId, QueueToken.Status status);
}
