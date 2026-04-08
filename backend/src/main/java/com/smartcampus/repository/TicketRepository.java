package com.smartcampus.repository;

import com.smartcampus.entity.Ticket;
import com.smartcampus.enums.Priority;
import com.smartcampus.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByReporterIdOrderByCreatedAtDesc(Long reporterId);

    List<Ticket> findByAssigneeIdOrderByCreatedAtDesc(Long assigneeId);

    List<Ticket> findByStatusOrderByCreatedAtDesc(TicketStatus status);

    List<Ticket> findAllByOrderByCreatedAtDesc();

    // #2 — duplicate guard
    @Query("SELECT COUNT(t) > 0 FROM Ticket t WHERE t.reporter.id = :reporterId " +
           "AND t.title = :title AND t.location = :location AND t.status = com.smartcampus.enums.TicketStatus.OPEN")
    boolean existsOpenTicketByReporterAndTitleAndLocation(
            @Param("reporterId") Long reporterId,
            @Param("title") String title,
            @Param("location") String location);

    // #3 — backend search/filter (admin/technician scope)
    @Query("SELECT t FROM Ticket t WHERE " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:category IS NULL OR t.category = :category) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:q IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%',:q,'%')) " +
           "OR LOWER(t.location) LIKE LOWER(CONCAT('%',:q,'%'))) " +
           "ORDER BY t.createdAt DESC")
    List<Ticket> searchTickets(@Param("status") TicketStatus status,
                               @Param("category") String category,
                               @Param("priority") Priority priority,
                               @Param("q") String q);

    // #3 — backend search/filter scoped to reporter (user scope)
    @Query("SELECT t FROM Ticket t WHERE t.reporter.id = :reporterId AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:category IS NULL OR t.category = :category) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:q IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%',:q,'%')) " +
           "OR LOWER(t.location) LIKE LOWER(CONCAT('%',:q,'%'))) " +
           "ORDER BY t.createdAt DESC")
    List<Ticket> searchMyTickets(@Param("reporterId") Long reporterId,
                                 @Param("status") TicketStatus status,
                                 @Param("category") String category,
                                 @Param("priority") Priority priority,
                                 @Param("q") String q);
}
