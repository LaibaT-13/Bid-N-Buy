package com.reusehubJava.backend.repository;

import com.reusehubJava.backend.model.PendingRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

@Repository
public interface PendingRegistrationRepository extends JpaRepository<PendingRegistration, Long> {
    
    @Query("SELECT p FROM PendingRegistration p WHERE p.uCusMail = :email")
    Optional<PendingRegistration> findByUCusMail(@Param("email") String email);
    
    @Query("DELETE FROM PendingRegistration p WHERE p.uCusMail = :email")
    void deleteByUCusMail(@Param("email") String email);
    
    // Clean up expired registrations
    @Query("DELETE FROM PendingRegistration p WHERE p.otpExpiry < :expiry")
    void deleteByOtpExpiryBefore(@Param("expiry") LocalDateTime expiry);
    
    // Find expired registrations for cleanup
    @Query("SELECT p FROM PendingRegistration p WHERE p.otpExpiry < :expiry")
    List<PendingRegistration> findByOtpExpiryBefore(@Param("expiry") LocalDateTime expiry);
}