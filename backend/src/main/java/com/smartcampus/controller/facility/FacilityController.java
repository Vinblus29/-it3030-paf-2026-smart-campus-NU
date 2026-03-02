package com.smartcampus.controller.facility;

import com.smartcampus.dto.facility.FacilityDTO;
import com.smartcampus.service.facility.FacilityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/facilities")
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

    @GetMapping("/{id}")
    public ResponseEntity<FacilityDTO> getFacilityById(@PathVariable Long id) {
        return ResponseEntity.ok(facilityService.getFacilityById(id));
    }

    @PostMapping
    public ResponseEntity<FacilityDTO> createFacility(@RequestBody FacilityDTO dto) {
        return ResponseEntity.ok(facilityService.createFacility(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FacilityDTO> updateFacility(@PathVariable Long id, @RequestBody FacilityDTO dto) {
        return ResponseEntity.ok(facilityService.updateFacility(id, dto));
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
}

