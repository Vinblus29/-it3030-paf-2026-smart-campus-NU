package com.smartcampus.repository;

import com.smartcampus.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    List<Booking> findByUserId(Long userId);
    
    List<Booking> findByFacilityId(Long facilityId);
    
    List<Booking> findByStatus(String status);
    
    @Query("SELECT b FROM Booking b WHERE b.facility.id = :facilityId AND " +
           "b.status = 'APPROVED' AND " +
           "((b.startTime <= :startTime AND b.endTime > :startTime) OR " +
           "(b.startTime < :endTime AND b.endTime >= :endTime) OR " +
           "(b.startTime >= :startTime AND b.endTime <= :endTime))")
    List<Booking> findConflictingBookings(@Param("facilityId") Long facilityId,
                                          @Param("startTime") LocalDateTime startTime,
                                          @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT b FROM Booking b WHERE b.facility.id = :facilityId AND b.status = 'APPROVED' " +
           "AND b.endTime > :now ORDER BY b.startTime ASC")
    List<Booking> findUpcomingBookings(@Param("facilityId") Long facilityId,
                                       @Param("now") LocalDateTime now);

    List<Booking> findByFacilityIdAndStartTimeAfter(Long facilityId, LocalDateTime startTime);

    List<Booking> findByFacilityIdAndStartTimeBetween(Long facilityId, LocalDateTime start, LocalDateTime end);
}

