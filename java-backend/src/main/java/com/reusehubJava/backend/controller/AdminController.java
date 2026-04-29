package com.reusehubJava.backend.controller;

import com.reusehubJava.backend.model.Admin;
import com.reusehubJava.backend.repository.AdminRepository;
import com.reusehubJava.backend.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
public class AdminController {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private AdminService adminService;

    // Admin creation is RESTRICTED — only existing admins can create new admins
    @PostMapping("/create-admin")
    public ResponseEntity<?> createAdmin(@RequestBody Admin admin) {
        try {
            if (!isCurrentUserAdmin()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Admin registration is restricted. Only existing admins can create new admin accounts.");
            }
            Admin createdAdmin = adminService.createAdmin(admin);
            return ResponseEntity.ok("Admin created successfully: " + createdAdmin.getAEmail());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create admin: " + e.getMessage());
        }
    }

    // Get admin count
    @GetMapping("/count")
    public ResponseEntity<Long> getAdminCount() {
        try {
            long count = adminRepository.count();
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Promote user to admin — restricted to admins only
    @PostMapping("/promote-user/{userId}")
    public ResponseEntity<?> promoteUserToAdmin(@PathVariable Long userId) {
        try {
            if (!isCurrentUserAdmin()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only admins can promote users to admin");
            }
            String result = adminService.promoteUserToAdmin(userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to promote user: " + e.getMessage());
        }
    }

    // Check if current user is admin
    @GetMapping("/check-admin")
    public ResponseEntity<?> checkIfAdmin() {
        try {
            boolean isAdmin = isCurrentUserAdmin();
            return ResponseEntity.ok(java.util.Map.of("isAdmin", isAdmin));
        } catch (Exception e) {
            return ResponseEntity.ok(java.util.Map.of("isAdmin", false));
        }
    }

    // Check if a specific user is admin
    @GetMapping("/check-admin/{userId}")
    public ResponseEntity<?> checkIfUserIsAdmin(@PathVariable Long userId) {
        try {
            boolean isAdmin = adminService.isUserAdminById(userId);
            return ResponseEntity.ok(java.util.Map.of("isAdmin", isAdmin));
        } catch (Exception e) {
            return ResponseEntity.ok(java.util.Map.of("isAdmin", false));
        }
    }

    // Helper: check if current authenticated user is admin
    private boolean isCurrentUserAdmin() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) return false;
            String email = authentication.getName();
            return adminRepository.findByAEmail(email).isPresent();
        } catch (Exception e) {
            return false;
        }
    }

    private String getCurrentAdminEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : "";
    }
}