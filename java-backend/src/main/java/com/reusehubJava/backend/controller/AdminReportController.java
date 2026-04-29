package com.reusehubJava.backend.controller;

import com.reusehubJava.backend.model.Report;
import com.reusehubJava.backend.model.Admin;
import com.reusehubJava.backend.model.User;
import com.reusehubJava.backend.model.Message;
import com.reusehubJava.backend.repository.ReportRepository;
import com.reusehubJava.backend.repository.AdminRepository;
import com.reusehubJava.backend.repository.UserRepository;
import com.reusehubJava.backend.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/reports")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
public class AdminReportController {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessageRepository messageRepository;

    // Get all pending reports for admin review
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingReports() {
        try {
            if (!isCurrentUserAdmin()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only admins can access reports");
            }

            List<Report> pendingReports = reportRepository.findByStatus(Report.ReportStatus.PENDING);
            System.out.println("📊 Found " + pendingReports.size() + " pending reports");
            
            return ResponseEntity.ok(pendingReports);
        } catch (Exception e) {
            System.out.println("❌ Error getting pending reports: " + e.getMessage());
            return ResponseEntity.badRequest().body("Failed to get pending reports");
        }
    }

    // Review report with action (BAN, WARN, DELETE, DISMISS)
    @PutMapping("/{reportId}/review")
    public ResponseEntity<?> reviewReport(@PathVariable Long reportId, @RequestBody ReviewReportRequest request) {
        try {
            if (!isCurrentUserAdmin()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Optional<Report> reportOpt = reportRepository.findById(reportId);
            if (!reportOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            // Get current admin
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String adminEmail = authentication.getName();
            Admin admin = adminRepository.findByAEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

            Report report = reportOpt.get();
            User reportedUser = report.getReportedUser();

            // Apply the action
            switch (request.getAction().toUpperCase()) {
                // BAN case removed as requested

                case "WARN":
                    reportedUser.setStatus(User.UserStatus.WARNED);
                    reportedUser.setWarningReason(request.getAdminNotes());
                    reportedUser.setWarnDate(new Date());
                    userRepository.save(reportedUser);
                    
                    // Send warning message to the user
                    User adminUser = userRepository.findByUCusMail(admin.getAEmail()).orElse(null);
                    if (adminUser != null) {
                        Message warningMessage = new Message();
                        warningMessage.setSender(adminUser);
                        warningMessage.setReceiver(reportedUser);
                        warningMessage.setContent("⚠️ WARNING: You have received an official warning from the administration.\n\n" +
                                                 "Reason: " + request.getAdminNotes() + "\n\n" +
                                                 "Please review our community guidelines and ensure your future behavior complies with our policies. " +
                                                 "Continued violations may result in further action including account suspension.");
                        warningMessage.setSentDate(new Date());
                        warningMessage.setIsRead(false);
                        messageRepository.save(warningMessage);
                    }
                    
                    System.out.println("⚠️ User warned and message sent: " + reportedUser.getUCusMail());
                    break;

                case "DELETE":
                    // Actually delete the user from database
                    String deletedUserEmail = reportedUser.getUCusMail();
                    userRepository.delete(reportedUser);
                    System.out.println("🗑️ User deleted: " + deletedUserEmail + " by admin: " + admin.getAEmail());
                    break;

                case "DISMISS":
                    System.out.println("✋ Report dismissed for: " + reportedUser.getUCusMail());
                    break;

                default:
                    return ResponseEntity.badRequest().body("Invalid action. Use: WARN, DELETE, or DISMISS");
            }

            // Update report status
            report.setStatus(Report.ReportStatus.REVIEWED);
            report.setReviewedBy(admin);
            report.setReviewDate(new Date());
            report.setAdminNotes(request.getAdminNotes());

            Report savedReport = reportRepository.save(report);
            return ResponseEntity.ok(savedReport);

        } catch (Exception e) {
            System.out.println("❌ Error reviewing report: " + e.getMessage());
            return ResponseEntity.badRequest().body("Failed to review report");
        }
    }

    // Helper method to check if current user is admin
    private boolean isCurrentUserAdmin() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            if (userEmail == null || userEmail.equals("anonymousUser")) {
                return false;
            }
            
            Optional<Admin> admin = adminRepository.findByAEmail(userEmail);
            return admin.isPresent() && admin.get().getStatus() == Admin.AdminStatus.ACTIVE;
        } catch (Exception e) {
            return false;
        }
    }

    // Request class for report review
    public static class ReviewReportRequest {
        private String action; // BAN, WARN, DELETE, DISMISS
        private String adminNotes;

        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        
        public String getAdminNotes() { return adminNotes; }
        public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
    }
}
