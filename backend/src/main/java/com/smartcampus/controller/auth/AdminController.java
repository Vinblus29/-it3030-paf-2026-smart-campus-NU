package com.smartcampus.controller.auth;

import com.smartcampus.dto.auth.UserResponse;
import com.smartcampus.service.auth.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserResponse> updateUserRole(@PathVariable Long id, @RequestParam String role) {
        return ResponseEntity.ok(adminService.updateUserRole(id, role));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/technicians")
    public ResponseEntity<List<UserResponse>> getTechnicians() {
        return ResponseEntity.ok(adminService.getTechnicians());
    }

    // Get pending users (awaiting approval)
    @GetMapping("/users/pending")
    public ResponseEntity<List<UserResponse>> getPendingUsers() {
        return ResponseEntity.ok(adminService.getPendingUsers());
    }

    // Approve a user (enable their account)
    @PutMapping("/users/{id}/approve")
    public ResponseEntity<UserResponse> approveUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.approveUser(id));
    }

    // Reject a user (delete their account)
    @DeleteMapping("/users/{id}/reject")
    public ResponseEntity<Void> rejectUser(@PathVariable Long id) {
        adminService.rejectUser(id);
        return ResponseEntity.ok().build();
    }

    // Enable a user
    @PutMapping("/users/{id}/enable")
    public ResponseEntity<UserResponse> enableUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.enableUser(id));
    }

    // Disable a user
    @PutMapping("/users/{id}/disable")
    public ResponseEntity<UserResponse> disableUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.disableUser(id));
    }

    // Get user statistics for analytics
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(adminService.getUserStats());
    }
}

