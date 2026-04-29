package com.reusehubJava.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "pending_registrations")
@Data
public class PendingRegistration {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "u_name", nullable = false)
    private String uName;
    
    @Column(name = "u_phone", nullable = false)
    private String uPhone;
    
    @Column(name = "u_cus_mail", nullable = false, unique = true)
    private String uCusMail;
    
    @Column(name = "u_password", nullable = false)
    private String uPassword; // Already hashed
    
    @Column(name = "address")
    private String address;
    
    @Column(name = "otp", nullable = false)
    private String otp;
    
    @Column(name = "otp_expiry", nullable = false)
    private LocalDateTime otpExpiry;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}