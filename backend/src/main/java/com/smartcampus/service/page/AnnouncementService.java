package com.smartcampus.service.page;

import com.smartcampus.dto.notification.CampusAnnouncementDto;
import com.smartcampus.entity.CampusAnnouncement;
import com.smartcampus.model.User;
import com.smartcampus.repository.CampusAnnouncementRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.security.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnnouncementService {
    
    @Autowired
    private CampusAnnouncementRepository announcementRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public List<CampusAnnouncementDto> getRecentAnnouncements() {
        return announcementRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
    
    public List<CampusAnnouncementDto> getAllAnnouncements() {
        return announcementRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
    
    public CampusAnnouncementDto createAnnouncement(String title, String content) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Admin user not found"));
        
        CampusAnnouncement announcement = new CampusAnnouncement(title, content, admin);
        announcement = announcementRepository.save(announcement);
        return toDto(announcement);
    }
    
    public CampusAnnouncementDto updateAnnouncement(Long id, String title, String content) {
        CampusAnnouncement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));
        announcement.setTitle(title);
        announcement.setContent(content);
        announcement.setUpdatedAt(LocalDateTime.now());
        announcement = announcementRepository.save(announcement);
        return toDto(announcement);
    }
    
    public void deleteAnnouncement(Long id) {
        if (!announcementRepository.existsById(id)) {
            throw new RuntimeException("Announcement not found");
        }
        announcementRepository.deleteById(id);
    }
    
    private CampusAnnouncementDto toDto(CampusAnnouncement ann) {
        return new CampusAnnouncementDto(
                ann.getId(),
                ann.getTitle(),
                ann.getContent(),
                ann.getCreatedAt(),
                ann.getAdmin().getFirstName() + " " + ann.getAdmin().getLastName()
        );
    }
}

