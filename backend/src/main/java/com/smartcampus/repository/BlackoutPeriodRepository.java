package com.smartcampus.repository;

import com.smartcampus.model.BlackoutPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BlackoutPeriodRepository extends JpaRepository<BlackoutPeriod, Long> {
    List<BlackoutPeriod> findByFacilityId(Long facilityId);
    
    List<BlackoutPeriod> findByFacilityIdAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
        Long facilityId, LocalDateTime endTime, LocalDateTime startTime);
}
