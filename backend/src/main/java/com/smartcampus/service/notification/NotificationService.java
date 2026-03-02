package com.smartcampus.service.notification;

import com.smartcampus.dto.notification.NotificationDTO;
import com.smartcampus.model.Notification;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.service.auth.AuthService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final AuthService authService;

    public NotificationService(NotificationRepository notificationRepository, AuthService authService) {
        this.notificationRepository = notificationRepository;
        this.authService = authService;
    }

    public List<NotificationDTO> getUserNotifications() {
        var user = authService.getCurrentUser();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public List<NotificationDTO> getUnreadNotifications() {
        var user = authService.getCurrentUser();
        return notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(user.getId()).stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public long getUnreadCount() {
        var user = authService.getCurrentUser();
        return notificationRepository.countUnreadByUserId(user.getId());
    }

    public NotificationDTO markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        notification.setRead(true);
        notification = notificationRepository.save(notification);
        
        return mapToDTO(notification);
    }

    public void markAllAsRead() {
        var user = authService.getCurrentUser();
        List<Notification> notifications = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(user.getId());
        
        for (Notification notification : notifications) {
            notification.setRead(true);
        }
        
        notificationRepository.saveAll(notifications);
    }

    private NotificationDTO mapToDTO(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        dto.setUserId(notification.getUser().getId());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setType(notification.getType());
        dto.setReferenceType(notification.getReferenceType());
        dto.setReferenceId(notification.getReferenceId());
        dto.setRead(notification.isRead());
        dto.setCreatedAt(notification.getCreatedAt());
        return dto;
    }
}

