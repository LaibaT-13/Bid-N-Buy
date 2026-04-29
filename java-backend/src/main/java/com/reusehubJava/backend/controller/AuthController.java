package com.reusehubJava.backend.controller;

import com.reusehubJava.backend.dto.AuthRequest;
import com.reusehubJava.backend.dto.AuthResponse;
import com.reusehubJava.backend.model.Admin;
import com.reusehubJava.backend.model.User;
import com.reusehubJava.backend.service.AuthService;
import com.reusehubJava.backend.repository.AdminRepository;
import com.reusehubJava.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminRepository adminRepository;

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            System.out.println("📝 SIGNUP REQUEST for: " + user.getUCusMail());
            String result = authService.registerUser(user);
            System.out.println("✅ User registered: " + user.getUCusMail());
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (RuntimeException e) {
            System.out.println("❌ SIGNUP ERROR: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Registration failed: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("💥 UNEXPECTED SIGNUP ERROR: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unexpected error: " + e.getMessage());
        }
    }

    @PostMapping("/verify-registration")
    public ResponseEntity<?> verifyRegistration(@RequestBody VerifyRegistrationRequest request) {
        try {
            System.out.println("🔐 VERIFYING REGISTRATION for: " + request.getEmail());
            String result = authService.verifyRegistrationOTP(request.getEmail(), request.getOtp());
            System.out.println("✅ REGISTRATION VERIFIED for: " + request.getEmail());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            System.out.println("❌ VERIFICATION FAILED: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            System.out.println("💥 VERIFICATION ERROR: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Verification failed: " + e.getMessage());
        }
    }

    @PostMapping("/resend-registration-otp")
    public ResponseEntity<?> resendRegistrationOTP(@RequestBody ResendOTPRequest request) {
        try {
            String result = authService.resendRegistrationOTP(request.getEmail());
            System.out.println("✅ RESEND OTP SUCCESS for: " + request.getEmail());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Resend failed: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthRequest authenticationRequest) throws Exception {
        try {
            System.out.println("🔐 LOGIN ATTEMPT for: " + authenticationRequest.getEmail());
            AuthResponse authResponse = authService.authenticateAndGenerateTokenWithDetails(
                authenticationRequest.getEmail(),
                authenticationRequest.getPassword()
            );
            System.out.println("✅ LOGIN SUCCESS for: " + authenticationRequest.getEmail());
            return ResponseEntity.ok(authResponse);
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            System.out.println("❌ LOGIN FAILED - Bad credentials: " + authenticationRequest.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
        } catch (RuntimeException e) {
            System.out.println("❌ LOGIN FAILED - Runtime error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            System.out.println("💥 LOGIN FAILED - Unexpected error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login failed: " + e.getMessage());
        }
    }

    @PostMapping("/admin-login")
    public ResponseEntity<?> adminLogin(@RequestBody AuthRequest authenticationRequest) {
        try {
            System.out.println("👑 ADMIN LOGIN ATTEMPT for: " + authenticationRequest.getEmail());

            String jwt = authService.authenticateAdminAndGenerateToken(
                authenticationRequest.getEmail(),
                authenticationRequest.getPassword()
            );

            User userToReturn;
            java.util.Optional<User> userOptional = userRepository.findByUCusMail(authenticationRequest.getEmail());

            if (userOptional.isPresent()) {
                userToReturn = userOptional.get();
            } else {
                Admin admin = adminRepository.findByAEmail(authenticationRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("Admin not found"));

                userToReturn = new User();
                userToReturn.setUName(admin.getAName());
                userToReturn.setUCusMail(admin.getAEmail());
                userToReturn.setUPhone(admin.getAPhone());
                userToReturn.setDateJoined(admin.getDateJoined());
                userToReturn.setUserId(admin.getAdminId());
            }

            userToReturn.setUPassword(null);

            System.out.println("✅ ADMIN LOGIN SUCCESS for: " + authenticationRequest.getEmail());
            return ResponseEntity.ok(new AdminAuthResponse(jwt, userToReturn));

        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            System.out.println("❌ ADMIN LOGIN FAILED - Bad credentials: " + authenticationRequest.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
        } catch (RuntimeException e) {
            System.out.println("❌ ADMIN LOGIN FAILED - Runtime error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            System.out.println("💥 ADMIN LOGIN FAILED - Unexpected error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Admin login failed: " + e.getMessage());
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            authService.initiatePasswordReset(request.getEmail());
            return ResponseEntity.ok("OTP sent successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
    }

    @PostMapping("/verify-otp-reset-password")
    public ResponseEntity<String> verifyOtpAndResetPassword(@RequestBody OtpResetPasswordRequest request) {
        try {
            authService.verifyOtpAndResetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
            return ResponseEntity.ok("Password reset successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<String> verifyEmail(@RequestBody VerifyEmailRequest request) {
        try {
            boolean isVerified = authService.verifyEmail(request.getToken());
            if (isVerified) {
                return ResponseEntity.ok("Email verified successfully! You can now log in.");
            } else {
                return ResponseEntity.badRequest().body("Invalid or expired verification token");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Verification failed");
        }
    }

    @PostMapping("/manual-verify")
    public ResponseEntity<String> manualVerifyEmail(@RequestBody ManualVerifyRequest request) {
        try {
            boolean isVerified = authService.manualVerifyEmail(request.getEmail());
            if (isVerified) {
                return ResponseEntity.ok("Email manually verified successfully! You can now log in.");
            } else {
                return ResponseEntity.badRequest().body("User not found or already verified");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Manual verification failed: " + e.getMessage());
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<String> resendVerificationEmail(@RequestBody ResendVerificationRequest request) {
        try {
            authService.resendVerificationEmail(request.getEmail());
            return ResponseEntity.ok("Verification email resent successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to resend: " + e.getMessage());
        }
    }

    @GetMapping("/debug/users")
    public ResponseEntity<List<String>> getUsers() {
        try {
            List<String> emails = userRepository.findAll()
                .stream()
                .map(User::getUCusMail)
                .collect(Collectors.toList());
            return ResponseEntity.ok(emails);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // ── Inner classes ──────────────────────────────────────────────────────────

    public static class AdminAuthResponse {
        private final String jwt;
        private final User user;
        private final String message = "Admin authentication successful";
        public AdminAuthResponse(String jwt, User user) { this.jwt = jwt; this.user = user; }
        public String getJwt() { return jwt; }
        public User getUser() { return user; }
        public String getMessage() { return message; }
    }

    public static class ForgotPasswordRequest {
        private String email;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class OtpResetPasswordRequest {
        private String email; private String otp; private String newPassword;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getOtp() { return otp; }
        public void setOtp(String otp) { this.otp = otp; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    public static class VerifyEmailRequest {
        private String token;
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
    }

    public static class ManualVerifyRequest {
        private String email;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class ResendVerificationRequest {
        private String email;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class VerifyRegistrationRequest {
        private String email; private String otp;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getOtp() { return otp; }
        public void setOtp(String otp) { this.otp = otp; }
    }

    public static class ResendOTPRequest {
        private String email;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }
}