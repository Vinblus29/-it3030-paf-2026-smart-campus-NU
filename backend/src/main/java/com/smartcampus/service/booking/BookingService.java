package com.smartcampus.service.booking;

import com.smartcampus.dto.booking.BookingDTO;
import com.smartcampus.dto.booking.BookingRequest;
import com.smartcampus.model.Booking;
import com.smartcampus.model.Facility;
import com.smartcampus.model.Notification;
import com.smartcampus.model.User;
import com.smartcampus.model.BookingWaitlist;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.FacilityRepository;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.repository.BookingWaitlistRepository;
import com.smartcampus.repository.BlackoutPeriodRepository;
import com.smartcampus.service.auth.AuthService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final FacilityRepository facilityRepository;
    private final NotificationRepository notificationRepository;
    private final BookingWaitlistRepository bookingWaitlistRepository;
    private final AuthService authService;
    private final com.smartcampus.service.notification.PushNotificationService pushNotificationService;
    private final BlackoutPeriodRepository blackoutPeriodRepository;

    public BookingService(BookingRepository bookingRepository,
                         FacilityRepository facilityRepository,
                         NotificationRepository notificationRepository,
                         BookingWaitlistRepository bookingWaitlistRepository,
                         AuthService authService,
                        com.smartcampus.service.notification.PushNotificationService pushNotificationService,
                        BlackoutPeriodRepository blackoutPeriodRepository) {
        this.bookingRepository = bookingRepository;
        this.facilityRepository = facilityRepository;
        this.notificationRepository = notificationRepository;
        this.bookingWaitlistRepository = bookingWaitlistRepository;
        this.authService = authService;
        this.pushNotificationService = pushNotificationService;
        this.blackoutPeriodRepository = blackoutPeriodRepository;
    }

    public List<BookingDTO> getAllBookings() {
        return bookingRepository.findAll().stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public List<BookingDTO> getUserBookings() {
        User currentUser = authService.getCurrentUser();
        return bookingRepository.findByUserId(currentUser.getId()).stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public List<BookingDTO> getBookingsByFacility(Long facilityId) {
        return bookingRepository.findByFacilityId(facilityId).stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public List<BookingDTO> getPendingBookings() {
        return bookingRepository.findByStatus("PENDING").stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public BookingDTO getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));
        return mapToDTO(booking);
    }

    @Transactional
    public BookingDTO createBooking(BookingRequest request) {
        User currentUser = authService.getCurrentUser();
        
        if (!currentUser.isEnabled()) {
            throw new RuntimeException("Your account is pending approval. You cannot create bookings yet.");
        }
        
        Facility facility = facilityRepository.findById(request.getFacilityId())
            .orElseThrow(() -> new RuntimeException("Facility not found"));

        if (!facility.isAvailable()) {
            throw new RuntimeException("Facility is not available");
        }

        // Blackout Period Validation
        List<com.smartcampus.model.BlackoutPeriod> blackoutPeriods = blackoutPeriodRepository
            .findByFacilityIdAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
                request.getFacilityId(), request.getEndTime(), request.getStartTime());
        
        if (!blackoutPeriods.isEmpty()) {
            String reason = blackoutPeriods.get(0).getReason();
            throw new RuntimeException("This time slot falls within a blackout period" + 
                (reason != null ? ": " + reason : ". Please choose another time."));
        }

        // Feature 7: Capacity Validation
        if (request.getNumberOfPeople() > facility.getCapacity()) {
            throw new RuntimeException("Number of people exceeds facility capacity (" + facility.getCapacity() + ")");
        }

        if (request.getNumberOfPeople() > facility.getCapacity() * 0.9) {
            // Optional: Log a warning or send a subtle notice that it's close to max capacity
        }

        // Feature 2: Recurring Booking Logic
        String recurringGroupId = "ONCE".equals(request.getRecurrenceType()) ? null : java.util.UUID.randomUUID().toString();
        
        if (!"ONCE".equals(request.getRecurrenceType()) && request.getRecurringUntil() != null) {
            return createRecurringBookings(request, facility, currentUser, recurringGroupId);
        }

        // Feature 1: Smart Conflict Detection (with 15 min buffer)
        LocalDateTime bufferedStart = request.getStartTime().minusMinutes(15);
        LocalDateTime bufferedEnd = request.getEndTime().plusMinutes(15);
        
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
            request.getFacilityId(), 
            bufferedStart, 
            bufferedEnd
        );

        if (!conflicts.isEmpty()) {
            // Feature 3: Waitlist System
            if (request.isJoinWaitlist()) {
                addToWaitlist(currentUser, facility, request.getStartTime(), request.getEndTime());
                throw new RuntimeException("Conflict detected. You have been added to the waitlist.");
            }
            
            // Feature 1: Suggest alternative slots (Simplified version)
            String suggestedSlots = suggestAlternativeSlots(facility.getId(), request.getStartTime(), 60);
            throw new RuntimeException("Time slot is already booked (including 15m buffer). Suggested slots: " + suggestedSlots);
        }

        Booking booking = new Booking();
        booking.setUser(currentUser);
        booking.setFacility(facility);
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setNumberOfPeople(request.getNumberOfPeople());
        booking.setAttachmentUrl(request.getAttachmentUrl());
        booking.setStatus("PENDING");
        booking.setRecurrenceType(request.getRecurrenceType());
        booking.setRecurringGroupId(recurringGroupId);
        booking.setCreatedAt(LocalDateTime.now());

        booking = bookingRepository.save(booking);

        createNotification(booking.getUser(), "Booking Submitted",
            "Your booking request for " + booking.getFacility().getName() + " has been submitted and is pending approval.", "BOOKING");
        
        pushNotificationService.sendToUser(booking.getUser(),
            "📋 Booking Submitted",
            "Your booking for " + booking.getFacility().getName() + " is pending approval.");

        return mapToDTO(booking);
    }

    @Transactional
    public BookingDTO updateBooking(Long id, BookingRequest request) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!"PENDING".equals(booking.getStatus()) && !"APPROVED".equals(booking.getStatus())) {
            throw new RuntimeException("Only pending or approved bookings can be edited");
        }

        Facility facility = facilityRepository.findById(request.getFacilityId())
            .orElseThrow(() -> new RuntimeException("Facility not found"));

        if (request.getNumberOfPeople() > facility.getCapacity()) {
            throw new RuntimeException("Number of people exceeds facility capacity (" + facility.getCapacity() + ")");
        }

        // Blackout Period Validation for Update
        List<com.smartcampus.model.BlackoutPeriod> blackoutPeriods = blackoutPeriodRepository
            .findByFacilityIdAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
                request.getFacilityId(), request.getEndTime(), request.getStartTime());
        
        if (!blackoutPeriods.isEmpty()) {
            String reason = blackoutPeriods.get(0).getReason();
            throw new RuntimeException("This time slot falls within a blackout period" + 
                (reason != null ? ": " + reason : ". Please choose another time."));
        }

        LocalDateTime bufferedStart = request.getStartTime().minusMinutes(15);
        LocalDateTime bufferedEnd = request.getEndTime().plusMinutes(15);
        
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
            request.getFacilityId(), 
            bufferedStart, 
            bufferedEnd
        ).stream()
            .filter(b -> !b.getId().equals(id))
            .collect(Collectors.toList());

        if (!conflicts.isEmpty()) {
            String suggestedSlots = suggestAlternativeSlots(facility.getId(), request.getStartTime(), 60);
            throw new RuntimeException("Time slot is already booked (including 15m buffer). Suggested slots: " + suggestedSlots);
        }

        booking.setFacility(facility);
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setNumberOfPeople(request.getNumberOfPeople());
        booking.setUpdatedAt(LocalDateTime.now());

        if ("APPROVED".equals(booking.getStatus())) {
            booking.setStatus("PENDING");
        }

        booking = bookingRepository.save(booking);

        createNotification(booking.getUser(), "Booking Updated",
            "Your booking for " + booking.getFacility().getName() + " has been updated and is pending re-approval.", "BOOKING");

        return mapToDTO(booking);
    }

    private BookingDTO createRecurringBookings(BookingRequest request, Facility facility, User user, String groupId) {
        LocalDateTime currentStart = request.getStartTime();
        LocalDateTime currentEnd = request.getEndTime();
        Booking firstBooking = null;

        while (currentStart.isBefore(request.getRecurringUntil()) || currentStart.isEqual(request.getRecurringUntil())) {
            // Check conflicts for each recurrence
            List<Booking> conflicts = bookingRepository.findConflictingBookings(
                facility.getId(), 
                currentStart.minusMinutes(15), 
                currentEnd.plusMinutes(15)
            );

            if (conflicts.isEmpty()) {
                Booking booking = new Booking();
                booking.setUser(user);
                booking.setFacility(facility);
                booking.setStartTime(currentStart);
                booking.setEndTime(currentEnd);
                booking.setPurpose(request.getPurpose());
                booking.setNumberOfPeople(request.getNumberOfPeople());
                booking.setStatus("PENDING");
                booking.setRecurrenceType(request.getRecurrenceType());
                booking.setRecurringGroupId(groupId);
                booking.setCreatedAt(LocalDateTime.now());
                
                Booking saved = bookingRepository.save(booking);
                if (firstBooking == null) firstBooking = saved;
            }

            // Move to next recurrence
            switch (request.getRecurrenceType()) {
                case "DAILY": currentStart = currentStart.plusDays(1); currentEnd = currentEnd.plusDays(1); break;
                case "WEEKLY": currentStart = currentStart.plusWeeks(1); currentEnd = currentEnd.plusWeeks(1); break;
                case "MONTHLY": currentStart = currentStart.plusMonths(1); currentEnd = currentEnd.plusMonths(1); break;
                default: 
                    if (firstBooking != null) {
                        createNotification(user, "Recurring Bookings Submitted",
                            "Your recurring bookings for " + facility.getName() + " have been submitted.", "BOOKING");
                        pushNotificationService.sendToUser(user,
                            "📋 Recurring Bookings",
                            "Your recurring bookings for " + facility.getName() + " are pending.");
                    }
                    return mapToDTO(firstBooking);
            }
        }
        
        if (firstBooking != null) {
            createNotification(user, "Recurring Bookings Submitted",
                "Your recurring bookings for " + facility.getName() + " have been submitted.", "BOOKING");
            pushNotificationService.sendToUser(user,
                "📋 Recurring Bookings",
                "Your recurring bookings for " + facility.getName() + " are pending.");
        }
        
        return mapToDTO(firstBooking);
    }

    private void addToWaitlist(User user, Facility facility, LocalDateTime start, LocalDateTime end) {
        List<BookingWaitlist> existing = bookingWaitlistRepository.findByFacilityIdAndStartTimeAndEndTimeOrderByPositionAsc(
            facility.getId(), start, end);
        int position = existing.size() + 1;
        
        BookingWaitlist waitlist = new BookingWaitlist(user, facility, start, end, position);
        bookingWaitlistRepository.save(waitlist);

        createNotification(user, "Added to Waitlist",
            "You have been added to the waitlist for " + facility.getName() + " at position " + position + ".", "BOOKING");
            
        pushNotificationService.sendToUser(user,
            "⏳ Waitlisted",
            "Added to waitlist for " + facility.getName() + " (Position: " + position + ").");
    }

    private String suggestAlternativeSlots(Long facilityId, LocalDateTime date, int durationMinutes) {
        // Implementation for "Next available slot" suggestion
        // For simplicity, we'll check slots after the requested time
        LocalDateTime current = date.plusMinutes(15);
        StringBuilder suggestions = new StringBuilder();
        int found = 0;
        
        while (found < 3 && current.isBefore(date.plusDays(1))) {
            List<Booking> conflicts = bookingRepository.findConflictingBookings(
                facilityId, current.minusMinutes(15), current.plusMinutes(durationMinutes + 15));
            if (conflicts.isEmpty()) {
                suggestions.append(current.getHour()).append(":").append(String.format("%02d", current.getMinute())).append(", ");
                found++;
                current = current.plusMinutes(60);
            } else {
                current = current.plusMinutes(30);
            }
        }
        return suggestions.length() > 0 ? suggestions.substring(0, suggestions.length() - 2) : "No slots available today";
    }

    @Transactional
    public BookingDTO approveBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!"PENDING".equals(booking.getStatus())) {
            throw new RuntimeException("Only pending bookings can be approved");
        }

        // Bug #5 Fix: Use same 15-min buffer as createBooking for consistency
        LocalDateTime bufferedStart = booking.getStartTime().minusMinutes(15);
        LocalDateTime bufferedEnd = booking.getEndTime().plusMinutes(15);
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
            booking.getFacility().getId(),
            bufferedStart,
            bufferedEnd
        );

        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Cannot approve: This time slot is already booked by another approved request.");
        }

        User currentUser = authService.getCurrentUser();
        booking.setStatus("APPROVED");
        booking.setApprovedBy(currentUser.getFirstName() + " " + currentUser.getLastName());
        booking.setApprovedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());
        
        // Feature 4: Generate unique QR token
        booking.setQrToken(java.util.UUID.randomUUID().toString());

        booking = bookingRepository.save(booking);

        // In-app notification
        createNotification(booking.getUser(), "Booking Approved", 
            "Your booking for " + booking.getFacility().getName() + " has been approved", "BOOKING");

        // Push notification
        pushNotificationService.sendToUser(booking.getUser(),
            "✅ Booking Approved",
            "Your booking for " + booking.getFacility().getName() + " has been approved.");

        return mapToDTO(booking);
    }

    @Transactional
    public BookingDTO rejectBooking(Long id, String reason) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!"PENDING".equals(booking.getStatus())) {
            throw new RuntimeException("Can only reject pending bookings");
        }

        booking.setStatus("REJECTED");
        booking.setRejectionReason(reason);
        booking.setUpdatedAt(LocalDateTime.now());

        booking = bookingRepository.save(booking);

        // In-app notification
        createNotification(booking.getUser(), "Booking Rejected", 
            "Your booking for " + booking.getFacility().getName() + " has been rejected: " + reason, "BOOKING");

        // Push notification
        pushNotificationService.sendToUser(booking.getUser(),
            "❌ Booking Rejected",
            "Your booking for " + booking.getFacility().getName() + " was rejected: " + reason);

        return mapToDTO(booking);
    }

    @Transactional
    public BookingDTO cancelBooking(Long id) {
        User currentUser = authService.getCurrentUser();
        
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Only owner or admin can cancel
        if (!booking.getUser().getId().equals(currentUser.getId()) 
            && currentUser.getRole() != com.smartcampus.enums.Role.ADMIN) {
            throw new RuntimeException("You can only cancel your own bookings");
        }

        booking.setStatus("CANCELLED");
        booking.setUpdatedAt(LocalDateTime.now());

        booking = bookingRepository.save(booking);

        createNotification(booking.getUser(), "Booking Cancelled",
            "Your booking for " + booking.getFacility().getName() + " has been cancelled.", "BOOKING");
            
        pushNotificationService.sendToUser(booking.getUser(),
            "🚫 Booking Cancelled",
            "Your booking for " + booking.getFacility().getName() + " has been cancelled.");

        // Bug #8 Fix: Promote from waitlist on ANY cancellation (PENDING or APPROVED)
        promoteFromWaitlist(booking.getFacility(), booking.getStartTime(), booking.getEndTime());

        return mapToDTO(booking);
    }

    private void promoteFromWaitlist(Facility facility, LocalDateTime start, LocalDateTime end) {
        List<BookingWaitlist> waitlist = bookingWaitlistRepository.findByFacilityIdAndStartTimeAndEndTimeOrderByPositionAsc(
            facility.getId(), start, end);
        
        if (!waitlist.isEmpty()) {
            BookingWaitlist first = waitlist.get(0);
            
            Booking booking = new Booking();
            booking.setUser(first.getUser());
            booking.setFacility(facility);
            booking.setStartTime(start);
            booking.setEndTime(end);
            booking.setPurpose("Promoted from Waitlist");
            booking.setStatus("PENDING");
            booking.setWaitlisted(true);
            booking.setCreatedAt(LocalDateTime.now());
            
            bookingRepository.save(booking);
            
            // Send notification to the promoted user
            createNotification(first.getUser(), "Waitlist Promotion", 
                "A slot has opened up for " + facility.getName() + ". Your booking is now pending approval.", "BOOKING");
            
            pushNotificationService.sendToUser(first.getUser(),
                "🎉 Waitlist Promotion",
                "A slot opened for " + facility.getName() + ". Your booking is now pending.");
            
            // Remove from waitlist
            bookingWaitlistRepository.delete(first);
        }
    }

    @Transactional
    public BookingDTO checkInByToken(String token) {
        // Bug #2 Fix: Use direct DB lookup instead of O(n) full table scan
        Booking booking = bookingRepository.findByQrToken(token)
            .filter(b -> "APPROVED".equals(b.getStatus()))
            .orElseThrow(() -> new RuntimeException("Invalid QR Token or booking not approved"));

        return checkIn(booking.getId());
    }

    @Transactional
    public BookingDTO checkIn(Long id) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!"APPROVED".equals(booking.getStatus())) {
            throw new RuntimeException("Only approved bookings can be checked in");
        }

        if (booking.getCheckedIn() != null && booking.getCheckedIn()) {
            throw new RuntimeException("Booking already checked in");
        }

        booking.setCheckedIn(true);
        booking.setCheckInTime(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());

        booking = bookingRepository.save(booking);

        // Send notification
        createNotification(booking.getUser(), "Checked In Successfully", 
            "You have successfully checked in for your booking at " + booking.getFacility().getName(), "BOOKING");
            
        pushNotificationService.sendToUser(booking.getUser(),
            "📍 Checked In",
            "You have successfully checked in at " + booking.getFacility().getName());

        return mapToDTO(booking);
    }

    @Transactional
    public void deleteBooking(Long id) {
        bookingRepository.deleteById(id);
    }

    private void createNotification(User user, String title, String message, String type) {
        Notification notification = new Notification(user, title, message, type);
        notificationRepository.save(notification);
    }

    private BookingDTO mapToDTO(Booking booking) {
        BookingDTO dto = new BookingDTO();
        dto.setId(booking.getId());
        dto.setUserId(booking.getUser().getId());
        dto.setUserEmail(booking.getUser().getEmail());
        dto.setUserName(booking.getUser().getFirstName() + " " + booking.getUser().getLastName());
        dto.setFacilityId(booking.getFacility().getId());
        dto.setFacilityName(booking.getFacility().getName());
        dto.setFacilityType(booking.getFacility().getType());
        dto.setStartTime(booking.getStartTime());
        dto.setEndTime(booking.getEndTime());
        dto.setPurpose(booking.getPurpose());
        dto.setStatus(booking.getStatus());
        dto.setApprovedBy(booking.getApprovedBy());
        dto.setApprovedAt(booking.getApprovedAt());
        dto.setRejectionReason(booking.getRejectionReason());
        dto.setAttachmentUrl(booking.getAttachmentUrl());
        dto.setNumberOfPeople(booking.getNumberOfPeople());
        dto.setCreatedAt(booking.getCreatedAt());
        dto.setCheckedIn(booking.getCheckedIn());
        dto.setCheckInTime(booking.getCheckInTime());
        dto.setQrToken(booking.getQrToken());
        dto.setRecurrenceType(booking.getRecurrenceType());
        dto.setRecurringGroupId(booking.getRecurringGroupId());
        dto.setWaitlisted(booking.isWaitlisted());
        return dto;
    }
}

