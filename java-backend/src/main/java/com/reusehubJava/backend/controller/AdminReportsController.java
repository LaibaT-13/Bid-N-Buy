package com.reusehubJava.backend.controller;

import com.reusehubJava.backend.model.MessageReport;
import com.reusehubJava.backend.model.User;
import com.reusehubJava.backend.repository.MessageReportRepository;
import com.reusehubJava.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/message-reports")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178"})
public class AdminReportsController {

    @Autowired
    private MessageReportRepository messageReportRepository;

    @Autowired
    private UserRepository userRepository;

    // Get all pending reports
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MessageReport>> getPendingReports() {
        try {
            List<MessageReport> reports = messageReportRepository.findPendingReports();
            return new ResponseEntity<>(reports, HttpStatus.OK);
        } catch (Exception e) {
            System.out.println("Error getting pending reports: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get all reports with filtering
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MessageReport>> getAllReports(
            @RequestParam(required = false) MessageReport.ReportStatus status,
            @RequestParam(required = false) MessageReport.ReportReason reason) {
        try {
            List<MessageReport> reports;
            
            if (status != null && reason != null) {
                reports = messageReportRepository.findAll().stream()
                    .filter(r -> r.getStatus() == status && r.getReason() == reason)
                    .toList();
            } else if (status != null) {
                reports = messageReportRepository.findByStatus(status);
            } else if (reason != null) {
                reports = messageReportRepository.findByReason(reason);
            } else {
                reports = messageReportRepository.findAll();
            }
            
            return new ResponseEntity<>(reports, HttpStatus.OK);
        } catch (Exception e) {
            System.out.println("Error getting reports: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Update report status
    @PutMapping("/{reportId}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageReport> reviewReport(
            @PathVariable Long reportId, 
            @RequestBody ReviewReportRequest request) {
        try {
            String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<User> adminOpt = userRepository.findByUCusMail(adminEmail);
            
            if (!adminOpt.isPresent()) {
                return new ResponseEntity<>(null, HttpStatus.UNAUTHORIZED);
            }

            Optional<MessageReport> reportOpt = messageReportRepository.findById(reportId);
            if (!reportOpt.isPresent()) {
                return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
            }

            MessageReport report = reportOpt.get();
            report.setStatus(request.getStatus());
            report.setReviewNotes(request.getReviewNotes());
            report.setReviewedBy(adminOpt.get());
            report.setReviewedDate(new Date());

            MessageReport updatedReport = messageReportRepository.save(report);
            
            System.out.println("📋 Report #" + reportId + " reviewed by " + adminOpt.get().getUName() + 
                             " with status: " + request.getStatus());
            
            return new ResponseEntity<>(updatedReport, HttpStatus.OK);

        } catch (Exception e) {
            System.out.println("Error reviewing report: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get report statistics
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReportStats> getReportStats() {
        try {
            List<MessageReport> allReports = messageReportRepository.findAll();
            
            long totalReports = allReports.size();
            long pendingReports = allReports.stream()
                .filter(r -> r.getStatus() == MessageReport.ReportStatus.PENDING)
                .count();
            long resolvedReports = allReports.stream()
                .filter(r -> r.getStatus() == MessageReport.ReportStatus.RESOLVED)
                .count();
            long dismissedReports = allReports.stream()
                .filter(r -> r.getStatus() == MessageReport.ReportStatus.DISMISSED)
                .count();

            ReportStats stats = new ReportStats();
            stats.setTotalReports(totalReports);
            stats.setPendingReports(pendingReports);
            stats.setResolvedReports(resolvedReports);
            stats.setDismissedReports(dismissedReports);

            return new ResponseEntity<>(stats, HttpStatus.OK);

        } catch (Exception e) {
            System.out.println("Error getting report stats: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // DTO for reviewing reports
    public static class ReviewReportRequest {
        private MessageReport.ReportStatus status;
        private String reviewNotes;

        // Getters and setters
        public MessageReport.ReportStatus getStatus() { return status; }
        public void setStatus(MessageReport.ReportStatus status) { this.status = status; }

        public String getReviewNotes() { return reviewNotes; }
        public void setReviewNotes(String reviewNotes) { this.reviewNotes = reviewNotes; }
    }

    // DTO for report statistics
    public static class ReportStats {
        private long totalReports;
        private long pendingReports;
        private long resolvedReports;
        private long dismissedReports;

        // Getters and setters
        public long getTotalReports() { return totalReports; }
        public void setTotalReports(long totalReports) { this.totalReports = totalReports; }

        public long getPendingReports() { return pendingReports; }
        public void setPendingReports(long pendingReports) { this.pendingReports = pendingReports; }

        public long getResolvedReports() { return resolvedReports; }
        public void setResolvedReports(long resolvedReports) { this.resolvedReports = resolvedReports; }

        public long getDismissedReports() { return dismissedReports; }
        public void setDismissedReports(long dismissedReports) { this.dismissedReports = dismissedReports; }
    }
}