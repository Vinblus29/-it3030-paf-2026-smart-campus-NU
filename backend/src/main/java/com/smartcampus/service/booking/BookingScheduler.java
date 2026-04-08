package com.smartcampus.service.booking;

import com.smartcampus.model.Booking;
import com.smartcampus.repository.BookingRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingScheduler {

    private final BookingRepository bookingRepository;

    public BookingScheduler(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    /**
     * Feature 6: Booking Request Expiry
     * PENDING bookings auto-expire if not reviewed within 48 hours
     * Runs every hour
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void expireOldPendingBookings() {
        LocalDateTime expiryThreshold = LocalDateTime.now().minusHours(48);
        List<Booking> pending = bookingRepository.findByStatus("PENDING");
        
        for (Booking booking : pending) {
            if (booking.getCreatedAt().isBefore(expiryThreshold)) {
                booking.setStatus("EXPIRED");
                booking.setUpdatedAt(LocalDateTime.now());
                bookingRepository.save(booking);
            }
        }
    }

    /**
     * Feature 4: No-show detection: if not checked in within 15 min of start time, mark as NO_SHOW
     * Runs every 5 minutes
     */
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void detectNoShows() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime noShowThreshold = now.minusMinutes(15);
        
        // Find bookings that started > 15 mins ago, are APPROVED, and NOT checked in
        List<Booking> approved = bookingRepository.findByStatus("APPROVED");
        
        for (Booking booking : approved) {
            if (booking.getStartTime().isBefore(noShowThreshold) && !booking.getCheckedIn()) {
                booking.setStatus("NO_SHOW");
                booking.setUpdatedAt(LocalDateTime.now());
                bookingRepository.save(booking);
                
                // Note: In a real system, we might trigger waitlist promotion here too
            }
        }
    }
}
