package com.reusehubJava.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Date;

@Entity
@Table(name = "message_report")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reportId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "message_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Message message;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reporter_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User reporter; // User who reported the message

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportReason reason;

    @Column(columnDefinition = "TEXT")
    private String additionalDetails; // Optional additional details from reporter

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private Date reportedDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.PENDING;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reviewed_by")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User reviewedBy; // Admin who reviewed the report

    @Temporal(TemporalType.TIMESTAMP)
    private Date reviewedDate;

    @Column(columnDefinition = "TEXT")
    private String reviewNotes; // Notes from admin review

    public enum ReportReason {
        SPAM,
        HARASSMENT,
        INAPPROPRIATE_CONTENT,
        SCAM_FRAUD,
        HATE_SPEECH,
        VIOLENCE_THREATS,
        FAKE_INFORMATION,
        OTHER
    }

    public enum ReportStatus {
        PENDING,
        UNDER_REVIEW,
        RESOLVED,
        DISMISSED
    }
}