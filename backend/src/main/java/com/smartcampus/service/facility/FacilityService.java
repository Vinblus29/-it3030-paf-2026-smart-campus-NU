package com.smartcampus.service.facility;

import com.smartcampus.dto.facility.FacilityDTO;
import com.smartcampus.model.Facility;
import com.smartcampus.repository.FacilityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FacilityService {

    private final FacilityRepository facilityRepository;

    public FacilityService(FacilityRepository facilityRepository) {
        this.facilityRepository = facilityRepository;
    }

    public List<FacilityDTO> getAllFacilities() {
        return facilityRepository.findAll().stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public List<FacilityDTO> getAvailableFacilities() {
        return facilityRepository.findByAvailableTrue().stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public List<FacilityDTO> getFacilitiesByType(String type) {
        return facilityRepository.findByType(type.toUpperCase()).stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public FacilityDTO getFacilityById(Long id) {
        Facility facility = facilityRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Facility not found"));
        return mapToDTO(facility);
    }

    @Transactional
    public FacilityDTO createFacility(FacilityDTO dto) {
        Facility facility = new Facility();
        facility.setName(dto.getName());
        facility.setType(dto.getType());
        facility.setLocation(dto.getLocation());
        facility.setCapacity(dto.getCapacity());
        facility.setDescription(dto.getDescription());
        facility.setImageUrl(dto.getImageUrl());
        facility.setEquipment(dto.getEquipment());
        facility.setAvailabilityWindows(dto.getAvailabilityWindows());
        facility.setAvailable(dto.isAvailable());
        facility.setCreatedAt(LocalDateTime.now());

        facility = facilityRepository.save(facility);
        return mapToDTO(facility);
    }

    @Transactional
    public FacilityDTO updateFacility(Long id, FacilityDTO dto) {
        Facility facility = facilityRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Facility not found"));

        facility.setName(dto.getName());
        facility.setType(dto.getType());
        facility.setLocation(dto.getLocation());
        facility.setCapacity(dto.getCapacity());
        facility.setDescription(dto.getDescription());
        facility.setImageUrl(dto.getImageUrl());
        facility.setEquipment(dto.getEquipment());
        facility.setAvailabilityWindows(dto.getAvailabilityWindows());
        facility.setAvailable(dto.isAvailable());
        facility.setUpdatedAt(LocalDateTime.now());

        facility = facilityRepository.save(facility);
        return mapToDTO(facility);
    }

    @Transactional
    public FacilityDTO updateAvailability(Long id, boolean available) {
        Facility facility = facilityRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Facility not found"));

        facility.setAvailable(available);
        facility.setUpdatedAt(LocalDateTime.now());

        facility = facilityRepository.save(facility);
        return mapToDTO(facility);
    }

    @Transactional
    public void deleteFacility(Long id) {
        facilityRepository.deleteById(id);
    }

    public List<FacilityDTO> searchFacilities(String query) {
        return facilityRepository.searchFacilities(query).stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    private FacilityDTO mapToDTO(Facility facility) {
        FacilityDTO dto = new FacilityDTO();
        dto.setId(facility.getId());
        dto.setName(facility.getName());
        dto.setType(facility.getType());
        dto.setLocation(facility.getLocation());
        dto.setCapacity(facility.getCapacity());
        dto.setDescription(facility.getDescription());
        dto.setImageUrl(facility.getImageUrl());
        dto.setAvailable(facility.isAvailable());
        dto.setEquipment(facility.getEquipment());
        dto.setAvailabilityWindows(facility.getAvailabilityWindows());
        dto.setCreatedAt(facility.getCreatedAt());
        return dto;
    }
}

