package com.smartcampus.service.marketing;

import com.smartcampus.dto.marketing.MarketingContentDTO;
import com.smartcampus.model.MarketingContent;
import com.smartcampus.repository.MarketingContentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

@Service
public class MarketingService {

    private final MarketingContentRepository marketingContentRepository;
    private final com.smartcampus.service.S3Service s3Service;

    public MarketingService(MarketingContentRepository marketingContentRepository,
                       com.smartcampus.service.S3Service s3Service) {
        this.marketingContentRepository = marketingContentRepository;
        this.s3Service = s3Service;
    }

    public List<MarketingContentDTO> getCarouselImages() {
        return marketingContentRepository.findByTypeAndActiveTrueOrderByDisplayOrderAsc("CAROUSEL")
            .stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public List<MarketingContentDTO> getTestimonials() {
        List<MarketingContent> testimonials = marketingContentRepository.findByTypeAndActiveTrueOrderByDisplayOrderAsc("TESTIMONIAL");
        if (testimonials.isEmpty()) {
            return getDefaultTestimonials();
        }
        return testimonials.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getNews() {
        List<MarketingContent> news = marketingContentRepository.findByTypeAndActiveTrueOrderByDisplayOrderAsc("NEWS");
        if (news.isEmpty()) {
            return getDefaultNews();
        }
        return news.stream().map(this::mapToNewsDTO).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getEvents() {
        List<MarketingContent> events = marketingContentRepository.findByTypeAndActiveTrueOrderByDisplayOrderAsc("EVENT");
        if (events.isEmpty()) {
            return getDefaultEvents();
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (MarketingContent e : events) {
            result.add(mapToEventDTO(e));
        }
        return result;
    }

    @Transactional
    public MarketingContentDTO createCarouselImage(MarketingContentDTO dto, MultipartFile image) {
        MarketingContent content = new MarketingContent();
        content.setType("CAROUSEL");
        content.setTitle(dto.getTitle());
        content.setSubtitle(dto.getSubtitle());
        content.setCtaText(dto.getCtaText());
        content.setCtaLink(dto.getCtaLink());
        content.setDisplayOrder(dto.getDisplayOrder());
        content.setActive(dto.getActive());

        if (image != null && !image.isEmpty()) {
            String url = s3Service.uploadFile(image);
            content.setImageUrl(url);
        } else {
            content.setImageUrl(dto.getImageUrl());
        }

        content = marketingContentRepository.save(content);
        return mapToDTO(content);
    }

    @Transactional
    public MarketingContentDTO updateCarouselImage(Long id, MarketingContentDTO dto, MultipartFile image) {
        MarketingContent content = marketingContentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Carousel image not found"));

        content.setTitle(dto.getTitle());
        content.setSubtitle(dto.getSubtitle());
        content.setCtaText(dto.getCtaText());
        content.setCtaLink(dto.getCtaLink());
        content.setDisplayOrder(dto.getDisplayOrder());
        content.setActive(dto.getActive());

        if (image != null && !image.isEmpty()) {
            String url = s3Service.uploadFile(image);
            content.setImageUrl(url);
        }

        content = marketingContentRepository.save(content);
        return mapToDTO(content);
    }

    @Transactional
    public void deleteCarouselImage(Long id) {
        marketingContentRepository.deleteById(id);
    }

    public void subscribeNewsletter(String email) {
        // Could store in a newsletter subscription table
        // For now, just log the subscription
        System.out.println("Newsletter subscription: " + email);
    }

    private MarketingContentDTO mapToDTO(MarketingContent content) {
        MarketingContentDTO dto = new MarketingContentDTO();
        dto.setId(content.getId());
        dto.setType(content.getType());
        dto.setTitle(content.getTitle());
        dto.setSubtitle(content.getSubtitle());
        dto.setContent(content.getContent());
        dto.setImage(content.getImage());
        dto.setImageUrl(content.getImageUrl());
        dto.setCtaText(content.getCtaText());
        dto.setCtaLink(content.getCtaLink());
        dto.setDisplayOrder(content.getDisplayOrder());
        dto.setActive(content.getActive());
        return dto;
    }

    private Map<String, Object> mapToNewsDTO(MarketingContent content) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("title", content.getTitle());
        dto.put("content", content.getContent());
        dto.put("date", content.getUpdatedAt() != null ? content.getUpdatedAt().toLocalDate().toString() : "");
        return dto;
    }

    private Map<String, Object> mapToEventDTO(MarketingContent content) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("title", content.getTitle());
        dto.put("date", content.getContent());
        dto.put("time", content.getSubtitle());
        dto.put("type", content.getImage());
        return dto;
    }

    private List<MarketingContentDTO> getDefaultTestimonials() {
        List<MarketingContentDTO> defaults = new ArrayList<>();
        String[][] data = {
            {"Sarah Johnson", "Computer Science Student", "Smart Campus has made booking study rooms so much easier! I can now plan my day efficiently and never worry about finding a space."},
            {"Dr. Michael Chen", "Professor of Engineering", "As a faculty member, the platform has streamlined our department's resource booking significantly. The admin dashboard is intuitive and powerful."},
            {"Emily Rodriguez", "Campus Operations Manager", "The QR check-in feature saved us countless hours. Our facility utilization has increased dramatically since implementing Smart Campus."}
        };
        for (String[] d : data) {
            MarketingContentDTO dto = new MarketingContentDTO();
            dto.setTitle(d[0]);
            dto.setSubtitle(d[1]);
            dto.setContent(d[2]);
            defaults.add(dto);
        }
        return defaults;
    }

    private List<Map<String, Object>> getDefaultNews() {
        List<Map<String, Object>> defaults = new ArrayList<>();
        defaults.add(Map.of("title", "New Library Hours for Finals Week", "content", "The main library will extend its hours during finals week to 24/7 operation.", "date", "2024-04-10"));
        defaults.add(Map.of("title", "Maintenance: Sports Center Closure", "content", "The sports center will be closed for maintenance on April 15th.", "date", "2024-04-08"));
        defaults.add(Map.of("title", "New Study Rooms Available", "content", "Five new group study rooms are now available for booking.", "date", "2024-04-05"));
        return defaults;
    }

    private List<Map<String, Object>> getDefaultEvents() {
        List<Map<String, Object>> defaults = new ArrayList<>();
        defaults.add(Map.of("title", "Campus Tour", "date", "2024-04-15", "time", "09:00 AM", "type", "event"));
        defaults.add(Map.of("title", "Workshop: Research Methods", "date", "2024-04-16", "time", "02:00 PM", "type", "event"));
        defaults.add(Map.of("title", "Career Fair", "date", "2024-04-18", "time", "10:00 AM", "type", "urgent"));
        defaults.add(Map.of("title", "Student Mixer", "date", "2024-04-20", "time", "06:00 PM", "type", "event"));
        defaults.add(Map.of("title", "Library Extended Hours", "date", "2024-04-22", "time", "12:00 AM", "type", "event"));
        return defaults;
    }
}