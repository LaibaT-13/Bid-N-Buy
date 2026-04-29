package com.reusehubJava.backend.repository;

import com.reusehubJava.backend.model.MessageReport;
import com.reusehubJava.backend.model.Message;
import com.reusehubJava.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReportRepository extends JpaRepository<MessageReport, Long> {

    // Check if a user has already reported a specific message
    Optional<MessageReport> findByMessageAndReporter(Message message, User reporter);

    // Find all reports by a specific reporter
    List<MessageReport> findByReporter(User reporter);

    // Find all reports for a specific message
    List<MessageReport> findByMessage(Message message);

    // Find reports by status
    List<MessageReport> findByStatus(MessageReport.ReportStatus status);

    // Find reports by reason
    List<MessageReport> findByReason(MessageReport.ReportReason reason);

    // Get all pending reports for admin review
    @Query("SELECT mr FROM MessageReport mr WHERE mr.status = 'PENDING' ORDER BY mr.reportedDate ASC")
    List<MessageReport> findPendingReports();

    // Get report count for a specific message
    @Query("SELECT COUNT(mr) FROM MessageReport mr WHERE mr.message = :message")
    Long countReportsByMessage(@Param("message") Message message);

    // Find reports reviewed by a specific admin
    List<MessageReport> findByReviewedBy(User admin);

    // Get reports with status and order by date
    @Query("SELECT mr FROM MessageReport mr WHERE mr.status = :status ORDER BY mr.reportedDate DESC")
    List<MessageReport> findByStatusOrderByReportedDateDesc(@Param("status") MessageReport.ReportStatus status);
}