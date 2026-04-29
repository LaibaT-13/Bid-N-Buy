package com.reusehubJava.backend.repository;

import com.reusehubJava.backend.model.Report;
import com.reusehubJava.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    
    // Get all reports by status
    List<Report> findByStatus(Report.ReportStatus status);
    
    // Get reports for a specific user (reported against them)
    List<Report> findByReportedUserOrderByReportDateDesc(User reportedUser);
    
    // Get reports made by a specific user
    List<Report> findByReporterOrderByReportDateDesc(User reporter);
    
    // Get reports for admin dashboard (all reports ordered by date)
    @Query("SELECT r FROM Report r ORDER BY r.reportDate DESC")
    List<Report> findAllOrderByReportDateDesc();
    
    // Count pending reports
    Long countByStatus(Report.ReportStatus status);
    
    // Get reports by severity
    List<Report> findBySeverityOrderByReportDateDesc(Report.ReportSeverity severity);
    
    // Delete reports by item ID (for cascading deletes)
    @Modifying
    @Transactional
    void deleteByItemItemId(Long itemId);
    
    // Find reports by item ID
    List<Report> findByItemItemId(Long itemId);
}
