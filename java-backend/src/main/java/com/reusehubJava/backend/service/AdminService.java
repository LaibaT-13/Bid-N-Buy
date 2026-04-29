package com.reusehubJava.backend.service;

import com.reusehubJava.backend.model.Admin;
import com.reusehubJava.backend.model.User;
import com.reusehubJava.backend.repository.AdminRepository;
import com.reusehubJava.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.UUID;
import java.util.List;
import java.util.ArrayList;

@Service
public class AdminService {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Admin createAdmin(Admin admin) {
        // Check if admin email already exists
        if (adminRepository.existsByAEmail(admin.getAEmail())) {
            throw new RuntimeException("Admin with this email already exists");
        }

        // Hash the password
        admin.setAPassword(passwordEncoder.encode(admin.getAPassword()));
        admin.setDateJoined(new Date());
        admin.setStatus(Admin.AdminStatus.ACTIVE);

        System.out.println("Creating new admin: " + admin.getAEmail());
        return adminRepository.save(admin);
    }

    public String authenticateAndGenerateToken(String email, String password) {
        // Find admin by email
        Admin admin = adminRepository.findByAEmail(email)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        // Check if admin is active
        if (admin.getStatus() != Admin.AdminStatus.ACTIVE) {
            throw new RuntimeException("Admin account is not active");
        }

        // For now, we'll create a simple token - you might want to integrate this with your JWT system
        // This is a temporary solution
        return "admin-token-" + admin.getAdminId() + "-" + System.currentTimeMillis();
    }

    public Admin getAdminByEmail(String email) {
        return adminRepository.findByAEmail(email)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
    }

    public String promoteUserToAdmin(Long userId) {
        // Find the user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user is already an admin
        if (adminRepository.findByAEmail(user.getUCusMail()).isPresent()) {
            throw new RuntimeException("User is already an admin");
        }

        // Create admin account from user
        Admin newAdmin = new Admin();
        newAdmin.setAName(user.getUName());
        newAdmin.setAEmail(user.getUCusMail());
        newAdmin.setAPassword(user.getUPassword()); // Use same hashed password
        newAdmin.setAPhone(user.getUPhone());
        newAdmin.setDateJoined(new Date());
        newAdmin.setStatus(Admin.AdminStatus.ACTIVE);

        Admin savedAdmin = adminRepository.save(newAdmin);

        System.out.println("👑 User promoted to admin: " + user.getUCusMail());
        return "User " + user.getUName() + " promoted to admin successfully!";
    }

    public List<Object> getPendingReports() {
        // Return endpoint info - actual implementation is in AdminReportController
        List<Object> result = new ArrayList<>();
        result.add("Use /api/admin/reports/pending endpoint for pending reports");
        return result;
    }

    public boolean isUserAdmin(String email) {
        return adminRepository.findByAEmail(email)
                .map(admin -> admin.getStatus() == Admin.AdminStatus.ACTIVE)
                .orElse(false);
    }

    public boolean isUserAdminById(Long userId) {
        // Find the user first
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return false;
        }
        
        // Check if user's email exists in admin table
        return adminRepository.findByAEmail(user.getUCusMail())
                .map(admin -> admin.getStatus() == Admin.AdminStatus.ACTIVE)
                .orElse(false);
    }
}
