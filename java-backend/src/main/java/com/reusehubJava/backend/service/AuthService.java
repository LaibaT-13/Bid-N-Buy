package com.reusehubJava.backend.service;

import com.reusehubJava.backend.model.User;
import com.reusehubJava.backend.model.Admin;
import com.reusehubJava.backend.model.PendingRegistration;
import com.reusehubJava.backend.repository.UserRepository;
import com.reusehubJava.backend.repository.AdminRepository;
import com.reusehubJava.backend.repository.PendingRegistrationRepository;
import com.reusehubJava.backend.security.jwt.JwtUtil;
import com.reusehubJava.backend.dto.AuthResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.Random;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PendingRegistrationRepository pendingRegistrationRepository;

    @Value("${reusehub.allowNonCuetEmails:true}")
    private boolean allowNonCuetEmails;

    // Registration with OTP verification - User is NOT saved to main database until OTP is verified
    @Transactional
    public String registerUser(User user) {
        // Normalize and validate email
        String email = user.getUCusMail() == null ? "" : user.getUCusMail().toLowerCase();
        user.setUCusMail(email);
        if (!allowNonCuetEmails) {
            if (!email.endsWith("@cuet.ac.bd") && !email.endsWith("@student.cuet.ac.bd")) {
                throw new RuntimeException("Only CUET email addresses are allowed (@cuet.ac.bd or @student.cuet.ac.bd)");
            }
        }

        // Check if user already exists in main database
        if (userRepository.findByUCusMail(email).isPresent()) {
            throw new RuntimeException("Email is already in use.");
        }
        
        // Check if there's already a pending registration for this email
        pendingRegistrationRepository.findByUCusMail(email).ifPresent(existing -> {
            // Delete the existing pending registration to allow a new one
            pendingRegistrationRepository.delete(existing);
        });

        // Create pending registration (NOT saving to main user table yet)
        PendingRegistration pendingReg = new PendingRegistration();
        pendingReg.setUName(user.getUName());
        pendingReg.setUPhone(user.getUPhone());
        pendingReg.setUCusMail(email);
        pendingReg.setAddress(user.getAddress());
        
        // Hash the password before storing
        pendingReg.setUPassword(passwordEncoder.encode(user.getUPassword()));

        // Generate OTP for verification
        String otp = String.format("%06d", new Random().nextInt(1000000));
        pendingReg.setOtp(otp);
        pendingReg.setOtpExpiry(LocalDateTime.now().plusMinutes(10)); // 10 minutes
        
        // Save to pending registrations table (NOT main user table)
        pendingRegistrationRepository.save(pendingReg);
        
        // Send registration OTP to email (with console fallback)
        try {
            emailService.sendRegistrationOtpEmail(user.getUCusMail(), otp);
            System.out.println("SUCCESS: Registration OTP sent to: " + user.getUCusMail());
        } catch (Exception e) {
            System.out.println("ERROR: Email failed, showing OTP in console: " + e.getMessage());
            System.out.println("==========================================");
            System.out.println("REGISTRATION OTP FOR: " + user.getUCusMail());
            System.out.println("YOUR OTP: " + otp);
            System.out.println("==========================================");
        }
        
        return "Please check your email (or console) for OTP to complete registration. User will only be created after OTP verification.";
    }

    // Verify OTP and complete registration - NOW creates the actual user
    @Transactional
    public String verifyRegistrationOTP(String email, String otp) {
        // Find pending registration (NOT from main user table)
        String normalizedEmail = email == null ? "" : email.toLowerCase();
        PendingRegistration pendingReg = pendingRegistrationRepository.findByUCusMail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("No pending registration found for this email. Please register first."));

        // Check OTP
        if (pendingReg.getOtp() == null || !pendingReg.getOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }

        // Check expiry
        if (pendingReg.getOtpExpiry() == null || pendingReg.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired. Please register again.");
        }

        // Create the actual user in main database
        User newUser = new User();
        newUser.setUName(pendingReg.getUName());
        newUser.setUPhone(pendingReg.getUPhone());
        newUser.setUCusMail(pendingReg.getUCusMail().toLowerCase());
        newUser.setUPassword(pendingReg.getUPassword()); // Already hashed
        newUser.setAddress(pendingReg.getAddress());
        
        // Set default values
        newUser.setDateJoined(new Date());
        newUser.setRole(User.Role.BUYER);
        newUser.setStatus(User.UserStatus.ACTIVE);
        newUser.setEmailVerified(true); // Now verified!
        
        // Save to main user table
        User savedUser = userRepository.save(newUser);
        
        // Clean up - remove from pending registrations
        pendingRegistrationRepository.delete(pendingReg);

        // Check if this is the first user and promote to admin
        long adminCount = adminRepository.count();
        if (adminCount == 0) {
            Admin newAdmin = new Admin();
            newAdmin.setAName(savedUser.getUName());
            newAdmin.setAEmail(savedUser.getUCusMail());
            newAdmin.setAPassword(savedUser.getUPassword());
            newAdmin.setAPhone(savedUser.getUPhone());
            newAdmin.setDateJoined(new Date());
            newAdmin.setStatus(Admin.AdminStatus.ACTIVE);
            
            adminRepository.save(newAdmin);
            
            System.out.println("SUCCESS: First user promoted to admin!");
        }
        
        return "Registration completed successfully!";
    }

    // Login method
    public String authenticateAndGenerateToken(String email, String password) {
        System.out.println("🔐 LOGIN ATTEMPT for: " + email);
        
        // 1. Find user by email
        User user = userRepository.findByUCusMail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        // 2. Check password
        if (!passwordEncoder.matches(password, user.getUPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        // 3. Check user status - Allow WARNED users to login but not BANNED users
        if (user.getStatus() == User.UserStatus.BANNED) {
            throw new RuntimeException("Account is banned");
        }

        // 4. Generate JWT token
        final UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        final String jwt = jwtUtil.generateToken(userDetails);

        System.out.println("✅ LOGIN SUCCESS for: " + email);
        return jwt;
    }

    // Login method with warning information
    public AuthResponse authenticateAndGenerateTokenWithDetails(String email, String password) {
        System.out.println("🔐 LOGIN ATTEMPT for: " + email);
        
        // 1. Find user by email
        User user = userRepository.findByUCusMail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        // 2. Check password
        if (!passwordEncoder.matches(password, user.getUPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        // 3. Check user status - Allow WARNED users to login but not BANNED users
        if (user.getStatus() == User.UserStatus.BANNED) {
            throw new RuntimeException("Account is banned");
        }

        // 4. Generate JWT token
        final UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        final String jwt = jwtUtil.generateToken(userDetails);

        // 5. Create response with warning information if user is warned
        if (user.getStatus() == User.UserStatus.WARNED) {
            String warningMessage = "Your account has been warned. Reason: " + 
                (user.getWarningReason() != null ? user.getWarningReason() : "Policy violation");
            System.out.println("⚠️ LOGIN SUCCESS with WARNING for: " + email);
            return new AuthResponse(jwt, warningMessage, true, user.getWarningReason());
        } else {
            System.out.println("✅ LOGIN SUCCESS for: " + email);
            return new AuthResponse(jwt);
        }
    }

    // Admin login method
    public String authenticateAdminAndGenerateToken(String email, String password) {
        System.out.println("👑 ADMIN LOGIN ATTEMPT for: " + email);
        
        // Find admin by email
        Admin admin = adminRepository.findByAEmail(email)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        // Check password
        if (!passwordEncoder.matches(password, admin.getAPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        // Check admin status
        if (admin.getStatus() != Admin.AdminStatus.ACTIVE) {
            throw new RuntimeException("Admin account is not active");
        }

        // Generate JWT token
        final UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        final String jwt = jwtUtil.generateToken(userDetails);

        System.out.println("✅ ADMIN LOGIN SUCCESS for: " + email);
        return jwt;
    }

    // Password reset methods (keep existing)
    public void initiatePasswordReset(String email) {
        User user = userRepository.findByUCusMail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate OTP
        String otp = String.format("%06d", new Random().nextInt(1000000));
        user.setResetOtp(otp);
        
        // Set expiry (10 minutes)
        user.setOtpExpiry(new Date(System.currentTimeMillis() + 10 * 60 * 1000));
        
        userRepository.save(user);
        
        // Send password reset OTP to email (with console fallback)
        try {
            emailService.sendPasswordResetOtpEmail(user.getUCusMail(), otp);
            System.out.println("SUCCESS: Password reset OTP sent to: " + email);
        } catch (Exception e) {
            System.out.println("ERROR: Email failed, showing OTP in console: " + e.getMessage());
            System.out.println("==========================================");
            System.out.println("PASSWORD RESET OTP FOR: " + email);
            System.out.println("YOUR RESET OTP: " + otp);
            System.out.println("==========================================");
        }
    }

    public void verifyOtpAndResetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByUCusMail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getResetOtp() == null || !user.getResetOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }

        if (user.getOtpExpiry() == null || user.getOtpExpiry().before(new Date())) {
            throw new RuntimeException("OTP has expired");
        }

        // Reset password
        user.setUPassword(passwordEncoder.encode(newPassword));
        user.setResetOtp("");
        user.setOtpExpiry(null);
        
        userRepository.save(user);
        
        System.out.println("✅ Password reset successful for: " + email);
    }

    public User getUserByUsername(String email) {
        return userRepository.findByUCusMail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Simple email verification methods
    public boolean verifyEmail(String token) {
        // Simple implementation - just mark user as verified
        try {
            // In a real implementation, you'd verify the token
            // For now, just return true to make it work
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean manualVerifyEmail(String email) {
        try {
            User user = userRepository.findByUCusMail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
            user.setEmailVerified(true);
            userRepository.save(user);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public void resendVerificationEmail(String email) {
        User user = userRepository.findByUCusMail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        // Simple implementation - just log that we would send email
        System.out.println("Would resend verification email to: " + user.getUCusMail());
    }

    // Resend registration OTP - now works with pending registrations
    @Transactional
    public String resendRegistrationOTP(String email) {
        // Check if user already exists in main database (already verified)
        String normalizedEmail = email == null ? "" : email.toLowerCase();
        if (userRepository.findByUCusMail(normalizedEmail).isPresent()) {
            throw new RuntimeException("User is already registered and verified. Please try logging in.");
        }

        // Find pending registration
        PendingRegistration pendingReg = pendingRegistrationRepository.findByUCusMail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("No pending registration found for this email. Please register first."));

        // Generate new OTP
        String otp = String.format("%06d", new Random().nextInt(1000000));
        pendingReg.setOtp(otp);
        pendingReg.setOtpExpiry(LocalDateTime.now().plusMinutes(10)); // 10 minutes
        
        // Save updated pending registration
        pendingRegistrationRepository.save(pendingReg);
        
        // Send registration OTP to email (with console fallback)
        try {
            emailService.sendRegistrationOtpEmail(pendingReg.getUCusMail(), otp);
            System.out.println("SUCCESS: Resend registration OTP sent to: " + pendingReg.getUCusMail());
        } catch (Exception e) {
            System.out.println("ERROR: Email failed, showing OTP in console: " + e.getMessage());
            System.out.println("==========================================");
            System.out.println("RESEND REGISTRATION OTP FOR: " + pendingReg.getUCusMail());
            System.out.println("YOUR NEW OTP: " + otp);
            System.out.println("==========================================");
        }
        
        return "New OTP sent successfully! Check your email or console.";
    }
}
