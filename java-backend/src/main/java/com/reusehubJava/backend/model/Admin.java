package com.reusehubJava.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "admin")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Admin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long adminId;

    @Column(nullable = false)
    private String aName;

    @Column(nullable = false, unique = true)
    private String aEmail;

    @Column(nullable = false)
    private String aPassword; // Hashed password

    @Column(nullable = false)
    private String aPhone;

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateJoined;

    @Enumerated(EnumType.STRING)
    private AdminStatus status = AdminStatus.ACTIVE;

    private String department; // Optional: which department the admin belongs to

    public enum AdminStatus {
        ACTIVE, INACTIVE, SUSPENDED
    }
}
