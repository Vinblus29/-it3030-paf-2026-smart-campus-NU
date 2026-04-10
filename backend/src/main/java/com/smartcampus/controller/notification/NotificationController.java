package com.smartcampus.controller.notification;

import com.smartcampus.dto.notification.FcmTokenRequest;
import com.smartcampus.dto.notification.NotificationDTO;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.auth.AuthService;
import com.smartcampus.service.notification.NotificationService;
import com.smartcampus.service.notification.PushNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final PushNotificationService pushNotificationService;
    private final AuthService authService;
    private final UserRepository userRepository;

    public NotificationController(NotificationService notificationService,
                                   PushNotificationService pushNotificationService,
                                   AuthService authService,
                                   UserRepository userRepository) {
        this.notificationService = notificationService;
        this.pushNotificationService = pushNotificationService;
        this.authService = authService;
        this.userRepository = userRepository;
    }

    // ─── In-app notifications ─────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getUserNotifications() {
        return ResponseEntity.ok(notificationService.getUserNotifications());
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications() {
        return ResponseEntity.ok(notificationService.getUnreadNotifications());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount() {
        return ResponseEntity.ok(notificationService.getUnreadCount());
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationDTO> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok().build();
    }

    // ─── Push notification: device registration ───────────────────────────────

    /**
     * Called by the frontend after the user grants notification permission.
     * Registers the FCM token as a platform endpoint in AWS SNS.
     */
    @PostMapping("/push/register")
    public ResponseEntity<Map<String, String>> registerPushToken(@RequestBody FcmTokenRequest request) {
        System.out.println("🚨 PUSH DEBUG Controller /push/register called, token length: " + (request.getFcmToken() != null ? request.getFcmToken().length() : 0));
        if (request.getFcmToken() == null || request.getFcmToken().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "FCM token is required"));
        }

        User user = authService.getCurrentUser();
        String endpointArn = pushNotificationService.registerEndpoint(user, request.getFcmToken());
        System.out.println("🚨 PUSH DEBUG Controller /push/register SUCCESS returning endpointArn: " + endpointArn);
        return ResponseEntity.ok(Map.of(
                "status", "registered",
                "endpointArn", endpointArn
        ));
    }

    // ─── Push notification: admin broadcast ───────────────────────────────────

    /**
     * Admin endpoint: send a push to ALL registered users.
     */
    @PostMapping("/push/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> broadcastPush(@RequestBody Map<String, String> payload) {
        String title = payload.getOrDefault("title", "Smart Campus");
        String body  = payload.getOrDefault("body", "");
        pushNotificationService.broadcastToAll(title, body);
        return ResponseEntity.ok(Map.of("status", "sent"));
    }

    /**
     * Admin endpoint: send a push to all users with a specific role.
     */
    @PostMapping("/push/broadcast-role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> broadcastToRole(@RequestBody Map<String, String> payload) {
        String title = payload.getOrDefault("title", "Smart Campus");
        String body  = payload.getOrDefault("body", "");
        String role  = payload.getOrDefault("role", "USER");
        pushNotificationService.broadcastToRole(role, title, body);
        return ResponseEntity.ok(Map.of("status", "sent", "role", role));
    }

    /**
     * Admin test endpoint: List all users with push tokens/endpoints
     */
    @GetMapping("/push/test-endpoints")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> testPushEndpoints() {
        System.out.println("🚨 PUSH DEBUG Controller test-endpoints called");
        List<User> users = userRepository.findAll();
        Map<String, Object> status = new HashMap<>();
        List<Map<String, String>> userStatuses = users.stream()
            .filter(u -> u.getFcmToken() != null)
            .map(u -> {
                Map<String, String> info = new HashMap<>();
                info.put("email", u.getEmail());
                info.put("role", u.getRole().name());
                info.put("fcmToken", u.getFcmToken().substring(0, 20) + "...");
                info.put("snsEndpointArn", u.getSnsEndpointArn() != null ? u.getSnsEndpointArn() : "null");
                info.put("status", u.getSnsEndpointArn() != null ? "registered" : "no-endpoint");
                return info;
            })
            .collect(Collectors.toList());
        status.put("usersWithTokens", userStatuses);
        status.put("total", userStatuses.size());
        return ResponseEntity.ok(status);
    }
}
