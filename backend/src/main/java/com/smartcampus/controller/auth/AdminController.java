package com.smartcampus.controller.auth;

import com.smartcampus.dto.auth.UserResponse;
import com.smartcampus.dto.notification.CampusAnnouncementDto;
import com.smartcampus.service.auth.AdminService;
import com.smartcampus.service.page.AnnouncementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final AnnouncementService announcementService;

    public AdminController(AdminService adminService, AnnouncementService announcementService) {
        this.adminService = adminService;
        this.announcementService = announcementService;
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

    // ─── Campus Announcements ─────────────────────────────────────────────────
    
    @GetMapping("/announcements")
    public ResponseEntity<List<CampusAnnouncementDto>> getAnnouncements() {
        return ResponseEntity.ok(announcementService.getAllAnnouncements());
    }

    @GetMapping("/announcements/recent")
    public ResponseEntity<List<CampusAnnouncementDto>> getRecentAnnouncements() {
        return ResponseEntity.ok(announcementService.getRecentAnnouncements());
    }

@PostMapping("/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CampusAnnouncementDto> createAnnouncement(@RequestBody Map<String, String> payload) {
        if (!payload.containsKey("title") || !payload.containsKey("content")) {
            throw new IllegalArgumentException("Title and content are required");
        }
        String title = payload.get("title").trim();
        String content = payload.get("content").trim();
        if (title.isEmpty() || content.isEmpty()) {
            throw new IllegalArgumentException("Title and content cannot be empty");
        }
        return ResponseEntity.ok(announcementService.createAnnouncement(title, content));
    }

@PutMapping("/announcements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CampusAnnouncementDto> updateAnnouncement(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        if (!payload.containsKey("title") || !payload.containsKey("content")) {
            throw new IllegalArgumentException("Title and content are required");
        }
        String title = payload.get("title").trim();
        String content = payload.get("content").trim();
        if (title.isEmpty() || content.isEmpty()) {
            throw new IllegalArgumentException("Title and content cannot be empty");
        }
        return ResponseEntity.ok(announcementService.updateAnnouncement(id, title, content));
    }

    @DeleteMapping("/announcements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAnnouncement(@PathVariable Long id) {
        announcementService.deleteAnnouncement(id);
        return ResponseEntity.ok().build();
    }
}

