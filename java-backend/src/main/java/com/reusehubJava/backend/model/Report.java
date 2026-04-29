package com.reusehubJava.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Date;

@Entity
@Table(name = "report")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reportId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reporter_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User reporter; // User who is making the report

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reported_user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User reportedUser; // User being reported

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Item item; // Item related to the report (optional)

    @Column(nullable = false)
    private String reason; // Reason for reporting (Fraud, Harassment, Spam, etc.)

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description; // Detailed description of the issue

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportSeverity severity = ReportSeverity.MEDIUM;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private Date reportDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reviewed_by", nullable = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Admin reviewedBy; // Admin who reviewed the report

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = true)
    private Date reviewDate;

    @Column(columnDefinition = "TEXT")
    private String adminNotes; // Admin notes about the report

    public enum ReportStatus {
        PENDING, REVIEWED, RESOLVED, DISMISSED
    }

    public enum ReportSeverity {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}
