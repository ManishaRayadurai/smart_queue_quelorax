package com.quelorax.backend.repository;

import com.quelorax.backend.entity.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {
    Optional<OtpCode> findTopByEmailIgnoreCaseAndPurposeOrderByIdDesc(String email, OtpCode.Purpose purpose);
    void deleteByEmailIgnoreCaseAndPurpose(String email, OtpCode.Purpose purpose);
}
