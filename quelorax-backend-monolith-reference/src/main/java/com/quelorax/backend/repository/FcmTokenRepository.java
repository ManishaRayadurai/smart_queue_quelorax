package com.quelorax.backend.repository;

import com.quelorax.backend.entity.FcmToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FcmTokenRepository extends JpaRepository<FcmToken, Long> {
    List<FcmToken> findByUserId(Long userId);
    Optional<FcmToken> findByToken(String token);
    void deleteByToken(String token);
    void deleteByUserId(Long userId);
}
