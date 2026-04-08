package com.smartcampus.repository;

import com.smartcampus.model.BookingWaitlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingWaitlistRepository extends JpaRepository<BookingWaitlist, Long> {
    
    List<BookingWaitlist> findByFacilityIdAndStartTimeAndEndTimeOrderByPositionAsc(
        Long facilityId, LocalDateTime startTime, LocalDateTime endTime);
    
    List<BookingWaitlist> findByUserId(Long userId);
}
