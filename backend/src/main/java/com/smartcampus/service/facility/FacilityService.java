package com.smartcampus.service.facility;

import com.smartcampus.dto.facility.FacilityDTO;
import com.smartcampus.dto.facility.BlackoutPeriodDTO;
import com.smartcampus.model.Facility;
import com.smartcampus.model.BlackoutPeriod;
import com.smartcampus.repository.FacilityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FacilityService {

    private final FacilityRepository facilityRepository;
    private final com.smartcampus.repository.BookingRepository bookingRepository;
    private final com.smartcampus.repository.BlackoutPeriodRepository blackoutPeriodRepository;
    private final com.smartcampus.service.S3Service s3Service;
    private final com.smartcampus.service.notification.NotificationService notificationService;
    private final com.smartcampus.service.notification.PushNotificationService pushNotificationService;
    private final com.smartcampus.repository.TicketRepository ticketRepository;

    public FacilityService(FacilityRepository facilityRepository,
                           com.smartcampus.repository.BookingRepository bookingRepository,
                           com.smartcampus.repository.BlackoutPeriodRepository blackoutPeriodRepository,
                           com.smartcampus.service.S3Service s3Service,
                           com.smartcampus.service.notification.NotificationService notificationService,
                           com.smartcampus.service.notification.PushNotificationService pushNotificationService,
                           com.smartcampus.repository.TicketRepository ticketRepository) {
        this.facilityRepository = facilityRepository;
        this.bookingRepository = bookingRepository;
        this.blackoutPeriodRepository = blackoutPeriodRepository;
        this.s3Service = s3Service;
        this.notificationService = notificationService;
        this.pushNotificationService = pushNotificationService;
        this.ticketRepository = ticketRepository;
    }

    public List<FacilityDTO> getAllFacilities() {
        return facilityRepository.findAll().stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public List<String> getAllTypes() {
        return facilityRepository.findDistinctTypes();
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
    public FacilityDTO createFacility(FacilityDTO dto, MultipartFile image) {
        Facility facility = new Facility();
        facility.setName(dto.getName());
        facility.setType(dto.getType());
        facility.setLocation(dto.getLocation());
        facility.setCapacity(dto.getCapacity());
        facility.setDescription(dto.getDescription());
        
        if (image != null && !image.isEmpty()) {
            facility.setImageUrl(s3Service.uploadFile(image));
        } else {
            facility.setImageUrl(dto.getImageUrl());
        }

        facility.setEquipment(dto.getEquipment());
        facility.setAvailabilityWindows(dto.getAvailabilityWindows());
        facility.setAvailable(dto.isAvailable());
        if (dto.getTags() != null) {
            facility.getTags().clear();
            facility.getTags().addAll(dto.getTags());
        }
        facility.setCreatedAt(LocalDateTime.now());

        facility = facilityRepository.save(facility);

        // Send Notification to all users
        String title = "New Facility Added!";
        String message = "A new facility '" + facility.getName() + "' is now available at " + facility.getLocation();
        notificationService.notifyAllUsers(title, message, "FACILITY", "FACILITY", facility.getId());
        pushNotificationService.broadcastToAll(title, message);

        return mapToDTO(facility);
    }

    @Transactional
    public FacilityDTO updateFacility(Long id, FacilityDTO dto, MultipartFile image) {
        Facility facility = facilityRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Facility not found"));

        facility.setName(dto.getName());
        facility.setType(dto.getType());
        facility.setLocation(dto.getLocation());
        facility.setCapacity(dto.getCapacity());
        facility.setDescription(dto.getDescription());
        
        if (image != null && !image.isEmpty()) {
            facility.setImageUrl(s3Service.uploadFile(image));
        } else if (dto.getImageUrl() != null) {
            facility.setImageUrl(dto.getImageUrl());
        }

        facility.setEquipment(dto.getEquipment());
        facility.setAvailabilityWindows(dto.getAvailabilityWindows());
        facility.setAvailable(dto.isAvailable());
        if (dto.getTags() != null) {
            facility.getTags().clear();
            facility.getTags().addAll(dto.getTags());
        }
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
        Facility facility = facilityRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Facility not found"));
        
        // Check for active bookings
        List<com.smartcampus.model.Booking> activeBookings = bookingRepository.findByFacilityIdAndStartTimeAfter(
            id, java.time.LocalDateTime.now());
        boolean hasActiveBookings = activeBookings.stream()
            .anyMatch(b -> "APPROVED".equals(b.getStatus()));
        
        if (hasActiveBookings) {
            throw new RuntimeException("Cannot delete facility with active bookings. Please cancel or complete all bookings first.");
        }
        
        // Delete related blackout periods first
        List<BlackoutPeriod> blackoutPeriods = blackoutPeriodRepository.findByFacilityId(id);
        blackoutPeriodRepository.deleteAll(blackoutPeriods);
        
        facilityRepository.deleteById(id);
    }

    public List<FacilityDTO> searchFacilities(String query) {
        return facilityRepository.searchFacilities(query).stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public List<FacilityDTO> searchFacilitiesByTags(Set<String> tags) {
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
        if (facilityId == null) {
            return "EXCELLENT";
        }
        
        com.smartcampus.model.Facility facility = facilityRepository.findById(facilityId).orElse(null);
        if (facility == null) {
            return "EXCELLENT";
        }
        
        String facilityName = facility.getName();
        String facilityLocation = facility.getLocation();
        
        List<com.smartcampus.enums.TicketStatus> resolvedStatuses = java.util.Arrays.asList(
            com.smartcampus.enums.TicketStatus.RESOLVED, 
            com.smartcampus.enums.TicketStatus.CLOSED, 
            com.smartcampus.enums.TicketStatus.REJECTED
        );
        
        long openTickets = 0;
        if (facilityName != null && !facilityName.isEmpty()) {
            openTickets = ticketRepository.countByFacilityIdOrLocationAndStatusNotIn(facilityId, facilityName, resolvedStatuses);
        }
        
        List<com.smartcampus.entity.Ticket> tickets = ticketRepository.findByFacilityIdOrLocation(facilityId, facilityLocation != null ? facilityLocation : "");
        
        List<com.smartcampus.enums.TicketStatus> activeStatuses = java.util.Arrays.asList(
            com.smartcampus.enums.TicketStatus.OPEN, 
            com.smartcampus.enums.TicketStatus.IN_PROGRESS
        );
        
        boolean hasCritical = tickets.stream()
            .filter(t -> t.getPriority() == com.smartcampus.enums.Priority.CRITICAL)
            .anyMatch(t -> activeStatuses.contains(t.getStatus()));
        
        boolean hasHighPriority = tickets.stream()
            .filter(t -> t.getPriority() == com.smartcampus.enums.Priority.HIGH)
            .anyMatch(t -> activeStatuses.contains(t.getStatus()));
        
        if (hasCritical || openTickets >= 5) {
            return "CRITICAL";
        }
        if (openTickets >= 3 || hasHighPriority) {
            return "NEEDS_ATTENTION";
        }
        if (openTickets > 0) {
            return "GOOD";
        }
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

    // ========== Blackout Period Management ==========

    public List<BlackoutPeriodDTO> getBlackoutPeriodsByFacility(Long facilityId) {
        return blackoutPeriodRepository.findByFacilityId(facilityId).stream()
            .map(this::mapToBlackoutDTO)
            .collect(Collectors.toList());
    }

    public List<BlackoutPeriodDTO> getAllBlackoutPeriods() {
        return blackoutPeriodRepository.findAll().stream()
            .map(this::mapToBlackoutDTO)
            .collect(Collectors.toList());
    }

    public BlackoutPeriodDTO createBlackoutPeriod(Long facilityId, BlackoutPeriodDTO dto) {
        Facility facility = facilityRepository.findById(facilityId)
            .orElseThrow(() -> new RuntimeException("Facility not found"));

        BlackoutPeriod blackout = new BlackoutPeriod();
        blackout.setFacility(facility);
        blackout.setStartTime(dto.getStartTime());
        blackout.setEndTime(dto.getEndTime());
        blackout.setReason(dto.getReason());

        blackout = blackoutPeriodRepository.save(blackout);
        return mapToBlackoutDTO(blackout);
    }

    public BlackoutPeriodDTO updateBlackoutPeriod(Long id, BlackoutPeriodDTO dto) {
        BlackoutPeriod blackout = blackoutPeriodRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Blackout period not found"));

        if (dto.getStartTime() != null) {
            blackout.setStartTime(dto.getStartTime());
        }
        if (dto.getEndTime() != null) {
            blackout.setEndTime(dto.getEndTime());
        }
        if (dto.getReason() != null) {
            blackout.setReason(dto.getReason());
        }

        blackout = blackoutPeriodRepository.save(blackout);
        return mapToBlackoutDTO(blackout);
    }

    public void deleteBlackoutPeriod(Long id) {
        blackoutPeriodRepository.deleteById(id);
    }

    private BlackoutPeriodDTO mapToBlackoutDTO(BlackoutPeriod bp) {
        BlackoutPeriodDTO dto = new BlackoutPeriodDTO();
        dto.setId(bp.getId());
        dto.setFacilityId(bp.getFacility().getId());
        dto.setFacilityName(bp.getFacility().getName());
        dto.setStartTime(bp.getStartTime());
        dto.setEndTime(bp.getEndTime());
        dto.setReason(bp.getReason());
        dto.setCreatedAt(bp.getCreatedAt());
        return dto;
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
        if (facility.getId() != null) {
            dto.setHealthScore(calculateHealthScore(facility.getId()));
            dto.setUtilizationPercentage(calculateUtilization(facility.getId()));
        } else {
            dto.setHealthScore("EXCELLENT");
            dto.setUtilizationPercentage(0.0);
        }
        dto.setCreatedAt(facility.getCreatedAt());
        return dto;
    }
}

