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
    private final com.smartcampus.repository.BookingRepository bookingRepository;
    private final com.smartcampus.repository.BlackoutPeriodRepository blackoutPeriodRepository;
    private final com.smartcampus.repository.MaintenanceTicketRepository maintenanceTicketRepository;

    public FacilityService(FacilityRepository facilityRepository,
                           com.smartcampus.repository.BookingRepository bookingRepository,
                           com.smartcampus.repository.BlackoutPeriodRepository blackoutPeriodRepository,
                           com.smartcampus.repository.MaintenanceTicketRepository maintenanceTicketRepository) {
        this.facilityRepository = facilityRepository;
        this.bookingRepository = bookingRepository;
        this.blackoutPeriodRepository = blackoutPeriodRepository;
        this.maintenanceTicketRepository = maintenanceTicketRepository;
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

    public List<FacilityDTO> searchFacilitiesByTags(java.util.Set<String> tags) {
        return facilityRepository.findAll().stream()
            .filter(f -> f.getTags().containsAll(tags))
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public List<FacilityDTO> getUnderUtilizedResources() {
        return facilityRepository.findAll().stream()
            .map(this::mapToDTO)
            .filter(dto -> dto.getUtilizationPercentage() < 30.0)
            .collect(Collectors.toList());
    }

    public String calculateHealthScore(Long facilityId) {
        long openTickets = maintenanceTicketRepository.countByFacilityIdAndStatusNot(facilityId, "CLOSED");
        List<com.smartcampus.model.MaintenanceTicket> tickets = maintenanceTicketRepository.findByFacilityId(facilityId);
        
        boolean hasCritical = tickets.stream().anyMatch(t -> "CRITICAL".equals(t.getPriority()) && !"CLOSED".equals(t.getStatus()));
        boolean hasHigh = tickets.stream().anyMatch(t -> "HIGH".equals(t.getPriority()) && !"CLOSED".equals(t.getStatus()));

        if (hasCritical || openTickets >= 5) return "CRITICAL";
        if (hasHigh || openTickets >= 3) return "NEEDS_ATTENTION";
        if (openTickets > 0) return "GOOD";
        return "EXCELLENT";
    }

    public Double calculateUtilization(Long facilityId) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<com.smartcampus.model.Booking> bookings = bookingRepository.findByFacilityIdAndStartTimeAfter(facilityId, thirtyDaysAgo);
        
        long bookedMinutes = bookings.stream()
            .filter(b -> "APPROVED".equals(b.getStatus()))
            .mapToLong(b -> java.time.Duration.between(b.getStartTime(), b.getEndTime()).toMinutes())
            .sum();
            
        // Assuming 12 hours per day availability (8am to 8pm)
        long totalAvailableMinutes = 30 * 12 * 60; 
        double utilization = (double) bookedMinutes / totalAvailableMinutes * 100;
        return Math.min(100.0, utilization);
    }

    public java.util.Map<String, Object> getAvailabilityStatus(Long facilityId, java.time.LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        List<com.smartcampus.model.Booking> bookings = bookingRepository.findByFacilityIdAndStartTimeBetween(facilityId, startOfDay, endOfDay);
        List<com.smartcampus.model.BlackoutPeriod> blackoutPeriods = blackoutPeriodRepository.findByFacilityIdAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(facilityId, endOfDay, startOfDay);

        java.util.List<java.util.Map<String, Object>> timeBlocks = new java.util.ArrayList<>();
        
        // Simulating 1 hour blocks from 08:00 to 20:00
        for (int hour = 8; hour < 20; hour++) {
            LocalDateTime blockStart = startOfDay.withHour(hour);
            LocalDateTime blockEnd = blockStart.plusHours(1);
            
            String status = "FREE";
            
            // Check Blackout
            boolean isBlackout = blackoutPeriods.stream().anyMatch(bp -> 
                (bp.getStartTime().isBefore(blockEnd) && bp.getEndTime().isAfter(blockStart)));
            
            if (isBlackout) {
                status = "MAINTENANCE";
            } else {
                // Check Bookings
                boolean isBooked = bookings.stream().anyMatch(b -> 
                    "APPROVED".equals(b.getStatus()) && (b.getStartTime().isBefore(blockEnd) && b.getEndTime().isAfter(blockStart)));
                if (isBooked) status = "BOOKED";
            }
            
            java.util.Map<String, Object> block = new java.util.HashMap<>();
            block.put("time", String.format("%02d:00", hour));
            block.put("status", status);
            timeBlocks.add(block);
        }

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("date", date);
        response.put("timeBlocks", timeBlocks);
        return response;
    }

    public byte[] generateQRCode(Long facilityId) throws Exception {
        String data = "https://smartcampus.com/booking?resourceId=" + facilityId;
        com.google.zxing.qrcode.QRCodeWriter qrCodeWriter = new com.google.zxing.qrcode.QRCodeWriter();
        com.google.zxing.common.BitMatrix bitMatrix = qrCodeWriter.encode(data, com.google.zxing.BarcodeFormat.QR_CODE, 250, 250);

        java.io.ByteArrayOutputStream pngOutputStream = new java.io.ByteArrayOutputStream();
        com.google.zxing.client.j2se.MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
        return pngOutputStream.toByteArray();
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
        dto.setTags(facility.getTags());
        dto.setHealthScore(calculateHealthScore(facility.getId()));
        dto.setUtilizationPercentage(calculateUtilization(facility.getId()));
        dto.setCreatedAt(facility.getCreatedAt());
        return dto;
    }
}

