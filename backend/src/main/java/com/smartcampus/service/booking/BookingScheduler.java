package com.smartcampus.service.booking;

import com.smartcampus.model.Booking;
import com.smartcampus.model.Notification;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.service.notification.PushNotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingScheduler {

    private final BookingRepository bookingRepository;
    private final NotificationRepository notificationRepository;
    private final PushNotificationService pushNotificationService;

    public BookingScheduler(BookingRepository bookingRepository,
                            NotificationRepository notificationRepository,
                            PushNotificationService pushNotificationService) {
        this.bookingRepository = bookingRepository;
        this.notificationRepository = notificationRepository;
        this.pushNotificationService = pushNotificationService;
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
            if (booking.getCreatedAt() != null && booking.getCreatedAt().isBefore(expiryThreshold)) {
                booking.setStatus("EXPIRED");
                booking.setUpdatedAt(LocalDateTime.now());
                bookingRepository.save(booking);

                // Bug #4 Fix: Notify user their booking was auto-expired
                try {
                    notificationRepository.save(new Notification(
                        booking.getUser(),
                        "Booking Expired",
                        "Your booking request for " + booking.getFacility().getName() +
                            " has expired as it was not reviewed within 48 hours.",
                        "BOOKING"
                    ));
                    pushNotificationService.sendToUser(booking.getUser(),
                        "⏰ Booking Expired",
                        "Your booking for " + booking.getFacility().getName() + " expired (no review in 48h).");
                } catch (Exception e) {
                    // Don't fail the scheduler if notification fails
                }
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
            // Bug #1 Fix: Use Boolean.TRUE.equals() to safely handle null checkedIn
            if (booking.getStartTime().isBefore(noShowThreshold) && !Boolean.TRUE.equals(booking.getCheckedIn())) {
                booking.setStatus("NO_SHOW");
                booking.setUpdatedAt(LocalDateTime.now());
                bookingRepository.save(booking);

                // Bug #10 Fix: Notify user they were marked as no-show
                try {
                    notificationRepository.save(new Notification(
                        booking.getUser(),
                        "Marked as No-Show",
                        "You were marked as a no-show for your booking at " +
                            booking.getFacility().getName() + ". Please contact admin if this is an error.",
                        "BOOKING"
                    ));
                    pushNotificationService.sendToUser(booking.getUser(),
                        "⚠️ No-Show Recorded",
                        "You were marked as no-show at " + booking.getFacility().getName() + ".");
                } catch (Exception e) {
                    // Don't fail the scheduler if notification fails
                }
            }
        }
    }
}
