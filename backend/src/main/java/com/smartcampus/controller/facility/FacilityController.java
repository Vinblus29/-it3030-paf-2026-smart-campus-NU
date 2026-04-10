package com.smartcampus.controller.facility;

import com.smartcampus.dto.facility.FacilityDTO;
import com.smartcampus.service.facility.FacilityService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/facilities")
@CrossOrigin
public class FacilityController {

    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    @GetMapping
    public ResponseEntity<List<FacilityDTO>> getAllFacilities() {
        return ResponseEntity.ok(facilityService.getAllFacilities());
    }

    @GetMapping("/available")
    public ResponseEntity<List<FacilityDTO>> getAvailableFacilities() {
        return ResponseEntity.ok(facilityService.getAvailableFacilities());
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<FacilityDTO>> getFacilitiesByType(@PathVariable String type) {
        return ResponseEntity.ok(facilityService.getFacilitiesByType(type));
    }

    @GetMapping("/search")
    public ResponseEntity<List<FacilityDTO>> searchFacilities(@RequestParam String q) {
        return ResponseEntity.ok(facilityService.searchFacilities(q));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacilityDTO> getFacilityById(@PathVariable Long id) {
        return ResponseEntity.ok(facilityService.getFacilityById(id));
    }

    @PostMapping
    public ResponseEntity<FacilityDTO> createFacility(
            @RequestParam("facility") String facilityJson,
            @RequestParam(value = "image", required = false) MultipartFile image) throws Exception {
        FacilityDTO dto = new ObjectMapper().registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule()).readValue(facilityJson, FacilityDTO.class);
        return ResponseEntity.ok(facilityService.createFacility(dto, image));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FacilityDTO> updateFacility(
            @PathVariable Long id,
            @RequestParam("facility") String facilityJson,
            @RequestParam(value = "image", required = false) MultipartFile image) throws Exception {
        FacilityDTO dto = new ObjectMapper().registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule()).readValue(facilityJson, FacilityDTO.class);
        return ResponseEntity.ok(facilityService.updateFacility(id, dto, image));
    }

    @PutMapping("/{id}/availability")
    public ResponseEntity<FacilityDTO> updateAvailability(@PathVariable Long id, @RequestParam boolean available) {
        return ResponseEntity.ok(facilityService.updateAvailability(id, available));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFacility(@PathVariable Long id) {
        facilityService.deleteFacility(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<java.util.Map<String, Object>> getAvailability(
            @PathVariable Long id,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date) {
        if (date == null) date = java.time.LocalDate.now();
        return ResponseEntity.ok(facilityService.getAvailabilityStatus(id, date));
    }

    @GetMapping("/{id}/qr")
    public ResponseEntity<byte[]> getQRCode(@PathVariable Long id) throws Exception {
        byte[] qrCode = facilityService.generateQRCode(id);
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.IMAGE_PNG)
                .body(qrCode);
    }

    @GetMapping("/tags")
    public ResponseEntity<List<FacilityDTO>> searchByTags(@RequestParam java.util.Set<String> tags) {
        return ResponseEntity.ok(facilityService.searchFacilitiesByTags(tags));
    }

    @GetMapping("/under-utilized")
    public ResponseEntity<List<FacilityDTO>> getUnderUtilized() {
        return ResponseEntity.ok(facilityService.getUnderUtilizedResources());
    }
}

