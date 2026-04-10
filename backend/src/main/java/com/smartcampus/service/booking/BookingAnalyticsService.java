package com.smartcampus.service.booking;

import com.smartcampus.model.Booking;
import com.smartcampus.repository.BookingRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BookingAnalyticsService {

    private final BookingRepository bookingRepository;

    public BookingAnalyticsService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    public Map<String, Object> getBookingAnalytics(LocalDateTime from, LocalDateTime to) {
        List<Booking> allBookings = bookingRepository.findAll();
        
        // Filter by date range if provided
        List<Booking> bookings = allBookings.stream()
            .filter(b -> b.getCreatedAt().isAfter(from) && b.getCreatedAt().isBefore(to))
            .collect(Collectors.toList());

        Map<String, Object> analytics = new HashMap<>();
        
        // Total bookings
        analytics.put("totalBookings", bookings.size());

        // Status Breakdown
        Map<String, Long> statusCount = bookings.stream()
            .collect(Collectors.groupingBy(Booking::getStatus, Collectors.counting()));
        analytics.put("statusBreakdown", statusCount);

        // Approval Rate
        long approved = statusCount.getOrDefault("APPROVED", 0L);
        long rejected = statusCount.getOrDefault("REJECTED", 0L);
        double approvalRate = (approved + rejected) == 0 ? 0 : (double) approved / (approved + rejected) * 100;
        analytics.put("approvalRate", approvalRate);

        // Most Booked Resources
        Map<String, Long> resourceRank = bookings.stream()
            .collect(Collectors.groupingBy(b -> b.getFacility().getName(), Collectors.counting()));
        analytics.put("mostBookedResources", resourceRank.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(5)
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue)));

        // Peak Hours Heatmap (Hour of Day)
        Map<Integer, Long> hourFrequency = bookings.stream()
            .collect(Collectors.groupingBy(b -> b.getStartTime().getHour(), Collectors.counting()));
        analytics.put("peakHoursHeatmap", hourFrequency);

        // Average Duration per Resource Type
        Map<String, Double> avgDurationByType = bookings.stream()
            .filter(b -> "APPROVED".equals(b.getStatus()))
            .collect(Collectors.groupingBy(
                b -> b.getFacility().getType(),
                Collectors.averagingLong(b -> java.time.Duration.between(b.getStartTime(), b.getEndTime()).toMinutes())
            ));
        analytics.put("avgDurationMinutesByType", avgDurationByType);

        return analytics;
    }
}
