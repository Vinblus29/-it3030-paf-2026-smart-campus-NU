package com.smartcampus.repository;

import com.smartcampus.entity.Ticket;
import com.smartcampus.enums.TicketStatus;
import com.smartcampus.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    
    List<Ticket> findByReporter(User reporter);
    
    List<Ticket> findByAssignee(User assignee);
    
    List<Ticket> findByStatus(TicketStatus status);
    
    List<Ticket> findByReporterId(Long userId);
    
    List<Ticket> findByAssigneeId(Long userId);
}

