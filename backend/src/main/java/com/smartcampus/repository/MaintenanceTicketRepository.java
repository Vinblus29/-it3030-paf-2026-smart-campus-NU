package com.smartcampus.repository;

import com.smartcampus.model.MaintenanceTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MaintenanceTicketRepository extends JpaRepository<MaintenanceTicket, Long> {
    List<MaintenanceTicket> findByFacilityId(Long facilityId);
    long countByFacilityIdAndStatusNot(Long facilityId, String status);
}
