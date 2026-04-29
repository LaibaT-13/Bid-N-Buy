package com.reusehubJava.backend.controller;

import com.reusehubJava.backend.model.Report;
import com.reusehubJava.backend.model.User;
import com.reusehubJava.backend.model.Item;
import com.reusehubJava.backend.model.Admin;
import com.reusehubJava.backend.repository.ReportRepository;
import com.reusehubJava.backend.repository.UserRepository;
import com.reusehubJava.backend.repository.ItemRepository;
import com.reusehubJava.backend.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ReportController {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private AdminRepository adminRepository;

    // Submit a new report
    @PostMapping("/submit")
    public ResponseEntity<Report> submitReport(@RequestBody ReportRequest request) {
        try {
            // Get current user from security context
            String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<User> reporterOpt = userRepository.findByUCusMail(currentUserEmail);
            
            if (!reporterOpt.isPresent()) {
                return new ResponseEntity<>(null, HttpStatus.UNAUTHORIZED);
            }

            // Find reported user
            Optional<User> reportedUserOpt = userRepository.findByUCusMail(request.getReportedUserEmail());
            if (!reportedUserOpt.isPresent()) {
                return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
            }

            // Prevent self-reporting
            if (reporterOpt.get().getUserId().equals(reportedUserOpt.get().getUserId())) {
                return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
            }

            Report report = new Report();
            report.setReporter(reporterOpt.get());
            report.setReportedUser(reportedUserOpt.get());
            report.setReason(request.getReason());
            report.setDescription(request.getDescription());
            report.setReportDate(new Date());
            report.setStatus(Report.ReportStatus.PENDING);
            
            // Set severity based on reason
            report.setSeverity(determineSeverity(request.getReason()));

            // If report is about an item
            if (request.getItemId() != null) {
                Optional<Item> itemOpt = itemRepository.findById(request.getItemId());
                itemOpt.ifPresent(report::setItem);
            }

            Report savedReport = reportRepository.save(report);
            return new ResponseEntity<>(savedReport, HttpStatus.CREATED);

        } catch (Exception e) {
            System.out.println("Error submitting report: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get all reports (Admin only)
    @GetMapping("/admin/all")
    public ResponseEntity<List<Report>> getAllReports() {
        try {
            // TODO: Add admin role check
            List<Report> reports = reportRepository.findAllOrderByReportDateDesc();
            return new ResponseEntity<>(reports, HttpStatus.OK);
        } catch (Exception e) {
            System.out.println("Error getting all reports: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get reports by status (Admin only)
    @GetMapping("/admin/status/{status}")
    public ResponseEntity<List<Report>> getReportsByStatus(@PathVariable String status) {
        try {
            Report.ReportStatus reportStatus = Report.ReportStatus.valueOf(status.toUpperCase());
            List<Report> reports = reportRepository.findByStatus(reportStatus);
            return new ResponseEntity<>(reports, HttpStatus.OK);
        } catch (Exception e) {
            System.out.println("Error getting reports by status: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Update report status (Admin only)
    @PutMapping("/admin/{reportId}/status")
    public ResponseEntity<Report> updateReportStatus(@PathVariable Long reportId, @RequestBody StatusUpdate statusUpdate) {
        try {
            Optional<Report> reportOpt = reportRepository.findById(reportId);
            if (!reportOpt.isPresent()) {
                return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
            }

            String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<Admin> adminOpt = adminRepository.findByAEmail(currentUserEmail);

            Report report = reportOpt.get();
            report.setStatus(Report.ReportStatus.valueOf(statusUpdate.getStatus().toUpperCase()));
            report.setAdminNotes(statusUpdate.getAdminNotes());
            report.setReviewDate(new Date());
            adminOpt.ifPresent(report::setReviewedBy);

            Report updatedReport = reportRepository.save(report);
            return new ResponseEntity<>(updatedReport, HttpStatus.OK);

        } catch (Exception e) {
            System.out.println("Error updating report status: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get pending reports count (Admin dashboard)
    @GetMapping("/admin/pending-count")
    public ResponseEntity<Long> getPendingReportsCount() {
        try {
            Long count = reportRepository.countByStatus(Report.ReportStatus.PENDING);
            return new ResponseEntity<>(count, HttpStatus.OK);
        } catch (Exception e) {
            System.out.println("Error getting pending reports count: " + e.getMessage());
            return new ResponseEntity<>(0L, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private Report.ReportSeverity determineSeverity(String reason) {
        switch (reason.toLowerCase()) {
            case "fraud":
            case "scam":
            case "threats":
                return Report.ReportSeverity.CRITICAL;
            case "harassment":
            case "inappropriate content":
                return Report.ReportSeverity.HIGH;
            case "spam":
            case "misleading information":
                return Report.ReportSeverity.MEDIUM;
            default:
                return Report.ReportSeverity.LOW;
        }
    }

    // DTO classes
    public static class ReportRequest {
        private String reportedUserEmail;
        private String reason;
        private String description;
        private Long itemId;

        // Getters and setters
        public String getReportedUserEmail() { return reportedUserEmail; }
        public void setReportedUserEmail(String reportedUserEmail) { this.reportedUserEmail = reportedUserEmail; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public Long getItemId() { return itemId; }
        public void setItemId(Long itemId) { this.itemId = itemId; }
    }

    public static class StatusUpdate {
        private String status;
        private String adminNotes;

        // Getters and setters
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getAdminNotes() { return adminNotes; }
        public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
    }
}
