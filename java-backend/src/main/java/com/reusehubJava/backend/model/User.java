package com.reusehubJava.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.Date;

@Entity
@Table(name = "user")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = false, unique = true)
    @JsonProperty("uName")
    private String uName; // Assuming this is the unique username/email for login

    @Column(nullable = false)
    @JsonProperty("uPhone")
    private String uPhone;

    @Column(nullable = false, unique = true)
    @JsonProperty("uCusMail")
    private String uCusMail;

    @Column(nullable = false)
    @JsonProperty("uPassword")
    private String uPassword; // Hashed password

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateJoined;

    @Enumerated(EnumType.STRING)
    private Role role; // ADMIN, USER

    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.ACTIVE; // ACTIVE, WARNED, BANNED

    private String address;

    // Email verification
    private Boolean emailVerified = false;

    // Ban/Warning fields
    private String banReason;
    private String warningReason;
    
    @Temporal(TemporalType.TIMESTAMP)
    private Date bannedDate;
    
    @Temporal(TemporalType.TIMESTAMP)
    private Date warnedDate;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "banned_by", nullable = true)
    @JsonIgnore
    private User bannedBy; // Admin who banned the user
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warned_by", nullable = true)
    @JsonIgnore
    private User warnedBy; // Admin who warned the user



    // Password reset fields
    private String resetOtp;
    
    @Temporal(TemporalType.TIMESTAMP)  
    private Date otpExpiry;

    // a_id from Admin is a FK, but we will simplify the relationship here.
    // private Long aId; 
    
    // Enum for Roles
    public enum Role {
        BUYER, SELLER // Users can be buyers or sellers, admins are separate entity
    }
    
    // Enum for User Status
    public enum UserStatus {
        ACTIVE,    // Normal user, can use all features
        WARNED,    // User has been warned, can still use features but with notification
        BANNED     // User is banned, cannot login or use any features
    }
    
    // Helper methods for AdminReportController
    public void setBanDate(Date banDate) {
        this.bannedDate = banDate;
    }
    
    public void setWarnDate(Date warnDate) {
        this.warnedDate = warnDate;
    }
}
