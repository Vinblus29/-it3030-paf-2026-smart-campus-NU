package com.smartcampus.repository;

import com.smartcampus.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByReportedBy(String reportedBy);

    List<Ticket> findByAssignedTo(String assignedTo);

    List<Ticket> findByStatus(com.smartcampus.enums.TicketStatus status);
}
