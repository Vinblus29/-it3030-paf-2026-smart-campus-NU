package com.smartcampus.controller.marketing;

import com.smartcampus.dto.marketing.MarketingContentDTO;
import com.smartcampus.service.marketing.MarketingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/marketing")
@CrossOrigin(origins = "*")
public class MarketingController {

    private final MarketingService marketingService;

    public MarketingController(MarketingService marketingService) {
        this.marketingService = marketingService;
    }

    @GetMapping("/carousel")
    public ResponseEntity<List<MarketingContentDTO>> getCarouselImages() {
        return ResponseEntity.ok(marketingService.getCarouselImages());
    }

    @GetMapping("/testimonials")
    public ResponseEntity<List<MarketingContentDTO>> getTestimonials() {
        return ResponseEntity.ok(marketingService.getTestimonials());
    }

    @GetMapping("/news")
    public ResponseEntity<List<Map<String, Object>>> getNews() {
        return ResponseEntity.ok(marketingService.getNews());
    }

    @GetMapping("/events")
    public ResponseEntity<List<Map<String, Object>>> getEvents() {
        return ResponseEntity.ok(marketingService.getEvents());
    }

    @PostMapping("/carousel")
    public ResponseEntity<MarketingContentDTO> createCarouselImage(
            @ModelAttribute MarketingContentDTO dto,
            @RequestParam(required = false) MultipartFile image) {
        return ResponseEntity.ok(marketingService.createCarouselImage(dto, image));
    }

    @PutMapping("/carousel/{id}")
    public ResponseEntity<MarketingContentDTO> updateCarouselImage(
            @PathVariable Long id,
            @ModelAttribute MarketingContentDTO dto,
            @RequestParam(required = false) MultipartFile image) {
        return ResponseEntity.ok(marketingService.updateCarouselImage(id, dto, image));
    }

    @DeleteMapping("/carousel/{id}")
    public ResponseEntity<Void> deleteCarouselImage(@PathVariable Long id) {
        marketingService.deleteCarouselImage(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/newsletter")
    public ResponseEntity<Map<String, String>> subscribeNewsletter(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        marketingService.subscribeNewsletter(email);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Successfully subscribed");
        return ResponseEntity.ok(response);
    }
}