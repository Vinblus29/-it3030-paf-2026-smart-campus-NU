package com.smartcampus.controller.auth;

import com.smartcampus.dto.auth.*;
import com.smartcampus.service.auth.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok("Password reset email sent successfully");
    }

@PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok("Password reset successfully");
    }

    @PostMapping("/generate-otp")
    public ResponseEntity<String> generateOtp(@Valid @RequestBody OtpGenerateRequest request) {
        authService.generateOtp(request);
        return ResponseEntity.ok("OTP sent successfully to your email");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        authService.verifyOtp(request);
        return ResponseEntity.ok("Password reset successfully");
    }

    @PostMapping("/verify-otp-only")
    public ResponseEntity<String> verifyOtpOnly(@Valid @RequestBody OtpOnlyVerifyRequest request) {
        authService.verifyOtpOnly(request);
        return ResponseEntity.ok("OTP verified successfully");
    }

    @PostMapping("/phone/generate-otp")
    public ResponseEntity<?> generatePhoneOtp(@RequestBody java.util.Map<String, String> req) {
        authService.generatePhoneOtp(req.get("phoneNumber"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/phone/verify-otp")
    public ResponseEntity<?> verifyPhoneOtp(@RequestBody java.util.Map<String, String> req) {
        authService.verifyPhoneOtp(req.get("phoneNumber"), req.get("otp"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/email/generate-otp")
    public ResponseEntity<?> generateEmailOtp(@RequestBody OtpGenerateRequest req) {
        authService.generateOtp(req);
        return ResponseEntity.ok("OTP sent successfully");
    }

    @PostMapping("/email/verify-otp")
    public ResponseEntity<?> verifyEmailOtp(@RequestBody java.util.Map<String, String> req) {
        authService.verifyPhoneOtp(req.get("email"), req.get("otp"));  // Update with proper email verify when implemented
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        return ResponseEntity.ok(authService.getCurrentUserResponse());
    }

    @PostMapping("/upload-profile-image")
    public ResponseEntity<String> uploadProfileImage(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        System.out.println("Processing profile image upload: " + file.getOriginalFilename());
        String url = authService.uploadProfileImage(file);
        return ResponseEntity.ok(url);
    }

    @PutMapping("/profile-image")
    public ResponseEntity<?> updateProfileImage(@RequestBody java.util.Map<String, String> request) {
        authService.updateProfileImage(request.get("imageUrl"));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(@RequestBody UserProfileUpdateRequest request) {
        return ResponseEntity.ok(authService.updateProfile(request));
    }

    @PostMapping("/register/send-otp-email")
    public ResponseEntity<?> sendRegOtpEmail(@RequestBody java.util.Map<String, String> req) {
        authService.sendRegistrationOtpEmail(req.get("email"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/register/verify-otp-email")
    public ResponseEntity<?> verifyRegOtpEmail(@RequestBody java.util.Map<String, String> req) {
        authService.verifyRegistrationOtpEmail(req.get("email"), req.get("otp"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/register/send-otp-phone")
    public ResponseEntity<?> sendRegOtpPhone(@RequestBody java.util.Map<String, String> req) {
        authService.sendRegistrationOtpPhone(req.get("phone"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/register/verify-otp-phone")
    public ResponseEntity<?> verifyRegOtpPhone(@RequestBody java.util.Map<String, String> req) {
        authService.verifyRegistrationOtpPhone(req.get("phone"), req.get("otp"));
        return ResponseEntity.ok().build();
    }
}

