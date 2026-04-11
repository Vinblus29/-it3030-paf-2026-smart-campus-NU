package com.smartcampus.service.ticket;

import com.smartcampus.entity.Ticket;
import com.smartcampus.enums.Priority;
import com.smartcampus.enums.Role;
import com.smartcampus.model.Notification;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.logging.Logger;

/**
 * TicketEscalationService
 *
 * Runs every hour and auto-escalates tickets that have been stale
 * (OPEN or IN_PROGRESS) beyond their priority threshold without any update.
 *
 * Escalation thresholds (hours without update):
 *   LOW      -> MEDIUM   after 48 hrs
 *   MEDIUM   -> HIGH     after 24 hrs
 *   HIGH     -> CRITICAL after 12 hrs
 *   CRITICAL -> no further escalation
 *
 * A ticket is only escalated once per threshold crossing (lastEscalatedAt guard).
 */
@Service
public class TicketEscalationService {

    private static final Logger log = Logger.getLogger(TicketEscalationService.class.getName());

    private static final long LOW_TO_MEDIUM_HOURS    = 48;
    private static final long MEDIUM_TO_HIGH_HOURS   = 24;
    private static final long HIGH_TO_CRITICAL_HOURS = 12;

    private final TicketRepository ticketRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public TicketEscalationService(TicketRepository ticketRepository,
                                   NotificationRepository notificationRepository,
                                   UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Scheduled(fixedRateString = "${ticket.escalation.interval-ms:3600000}")
    @Transactional
    public void escalateStaleTickets() {
        log.info("[Escalation] Running auto-escalation check...");

        List<Ticket> activeTickets = ticketRepository.findActiveTicketsForEscalation();
        LocalDateTime now = LocalDateTime.now();
        int escalatedCount = 0;

        for (Ticket ticket : activeTickets) {
            Priority current = ticket.getPriority();

            if (current == null || current == Priority.CRITICAL) continue;

            // Use updatedAt if available, otherwise createdAt as the staleness reference
            LocalDateTime reference = ticket.getUpdatedAt() != null
                    ? ticket.getUpdatedAt()
                    : ticket.getCreatedAt();

            if (reference == null) continue;

            long hoursStale = Duration.between(reference, now).toHours();
            long threshold = getThreshold(current);

            if (hoursStale < threshold) continue;

            // Guard: skip if already escalated after the last update
            if (ticket.getLastEscalatedAt() != null
                    && !ticket.getLastEscalatedAt().isBefore(reference)) {
                continue;
            }

            Priority newPriority = escalate(current);
            Priority oldPriority = current;

            ticket.setPriority(newPriority);
            ticket.setLastEscalatedAt(now);
            ticketRepository.save(ticket);

            log.info(String.format("[Escalation] Ticket #%d '%s' escalated %s -> %s (stale %d hrs)",
                    ticket.getId(), ticket.getTitle(), oldPriority, newPriority, hoursStale));

            notifyEscalation(ticket, oldPriority, newPriority);
            escalatedCount++;
        }

        log.info(String.format("[Escalation] Done. %d ticket(s) escalated.", escalatedCount));
    }

    private long getThreshold(Priority priority) {
        switch (priority) {
            case LOW:    return LOW_TO_MEDIUM_HOURS;
            case MEDIUM: return MEDIUM_TO_HIGH_HOURS;
            case HIGH:   return HIGH_TO_CRITICAL_HOURS;
            default:     return Long.MAX_VALUE;
        }
    }

    private Priority escalate(Priority priority) {
        switch (priority) {
            case LOW:    return Priority.MEDIUM;
            case MEDIUM: return Priority.HIGH;
            case HIGH:   return Priority.CRITICAL;
            default:     return priority;
        }
    }

    private void notifyEscalation(Ticket ticket, Priority oldPriority, Priority newPriority) {
        String message = String.format(
                "Ticket '%s' priority auto-escalated from %s to %s due to inactivity.",
                ticket.getTitle(), oldPriority, newPriority);

        String title = "Ticket #" + ticket.getId() + " Priority Escalated";

        // Notify all admins
        userRepository.findByRole(Role.ADMIN).forEach(admin -> {
            Notification n = new Notification(admin, title, message, "TICKET");
            n.setReferenceType("TICKET");
            n.setReferenceId(ticket.getId());
            notificationRepository.save(n);
        });

        // Notify reporter
        if (ticket.getReporter() != null) {
            Notification n = new Notification(ticket.getReporter(), title, message, "TICKET");
            n.setReferenceType("TICKET");
            n.setReferenceId(ticket.getId());
            notificationRepository.save(n);
        }

        // Notify assignee if assigned
        if (ticket.getAssignee() != null) {
            Notification n = new Notification(ticket.getAssignee(), title, message, "TICKET");
            n.setReferenceType("TICKET");
            n.setReferenceId(ticket.getId());
            notificationRepository.save(n);
        }
    }
}
