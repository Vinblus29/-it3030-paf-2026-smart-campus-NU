package com.smartcampus.service.booking;

import com.smartcampus.dto.booking.BookingDTO;
import com.smartcampus.dto.booking.BookingRequest;
import com.smartcampus.model.Booking;
import com.smartcampus.model.Facility;
import com.smartcampus.model.Notification;
import com.smartcampus.model.User;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.FacilityRepository;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.repository.UserRepository;
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
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final AuthService authService;

    public BookingService(BookingRepository bookingRepository,
                         FacilityRepository facilityRepository,
                         UserRepository userRepository,
                         NotificationRepository notificationRepository,
                         AuthService authService) {
        this.bookingRepository = bookingRepository;
        this.facilityRepository = facilityRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.authService = authService;
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

        // Check for conflicts
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
            request.getFacilityId(), 
            request.getStartTime(), 
            request.getEndTime()
        );

        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Time slot is already booked");
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
        booking.setCreatedAt(LocalDateTime.now());

        booking = bookingRepository.save(booking);
        return mapToDTO(booking);
    }

    @Transactional
    public BookingDTO approveBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!"PENDING".equals(booking.getStatus())) {
            throw new RuntimeException("Only pending bookings can be approved");
        }

        // Check for conflicts with APPROVED bookings again to be sure
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
            booking.getFacility().getId(),
            booking.getStartTime(),
            booking.getEndTime()
        );

        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Cannot approve: This time slot is already booked by another approved request.");
        }

        User currentUser = authService.getCurrentUser();
        booking.setStatus("APPROVED");
        booking.setApprovedBy(currentUser.getFirstName() + " " + currentUser.getLastName());
        booking.setApprovedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());

        booking = bookingRepository.save(booking);

        // Send notification
        createNotification(booking.getUser(), "Booking Approved", 
            "Your booking for " + booking.getFacility().getName() + " has been approved", "BOOKING");

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

        // Send notification
        createNotification(booking.getUser(), "Booking Rejected", 
            "Your booking for " + booking.getFacility().getName() + " has been rejected: " + reason, "BOOKING");

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
        return mapToDTO(booking);
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
        return dto;
    }
}

