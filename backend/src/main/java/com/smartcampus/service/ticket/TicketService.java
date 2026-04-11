package com.smartcampus.service.ticket;

import com.smartcampus.dto.ticket.TicketRequest;
import com.smartcampus.dto.ticket.TicketResponse;
import com.smartcampus.dto.ticket.UpdateStatusRequest;
import com.smartcampus.entity.Ticket;
import com.smartcampus.enums.Priority;
import com.smartcampus.enums.Role;
import com.smartcampus.enums.TicketCategory;
import com.smartcampus.enums.TicketStatus;
import com.smartcampus.model.Notification;
import com.smartcampus.model.User;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.S3Service;
import com.smartcampus.service.auth.AuthService;
import com.smartcampus.service.notification.PushNotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final AuthService authService;
    private final S3Service s3Service;
    private final PushNotificationService pushNotificationService;

    public TicketService(TicketRepository ticketRepository, UserRepository userRepository,
                         NotificationRepository notificationRepository, AuthService authService,
                         S3Service s3Service, PushNotificationService pushNotificationService) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.authService = authService;
        this.s3Service = s3Service;
        this.pushNotificationService = pushNotificationService;
    }

    @Transactional
    public TicketResponse createTicket(TicketRequest request, List<MultipartFile> images) {
        User currentUser = authService.getCurrentUser();
        if (!currentUser.isEnabled()) {
            throw new RuntimeException("Account is pending approval. You cannot raise tickets yet.");
        }

        // Validate category against enum
        try {
            TicketCategory.valueOf(request.getCategory().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid category: " + request.getCategory());
        }

        // Duplicate ticket guard
        if (ticketRepository.existsOpenTicketByReporterAndTitleAndLocation(
                currentUser.getId(), request.getTitle(), request.getLocation())) {
            throw new RuntimeException(
                "You already have an open ticket for this issue at this location.");
        }

        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setCategory(request.getCategory().toUpperCase());
        ticket.setLocation(request.getLocation());
        ticket.setContactDetails(request.getContactDetails());
        ticket.setPriority(request.getPriority());
        ticket.setReporter(currentUser);
        ticket.setFacilityId(request.getFacilityId());

        if (images != null && !images.isEmpty()) {
            List<String> urls = new ArrayList<>();
            int count = Math.min(images.size(), 3);
            for (int i = 0; i < count; i++) {
                if (!images.get(i).isEmpty()) {
                    urls.add(s3Service.uploadFile(images.get(i)));
                }
            }
            if (!urls.isEmpty()) {
                ticket.setImageUrls(String.join(",", urls));
            }
        }

        return toResponse(ticketRepository.save(ticket), currentUser);
    }

    public List<TicketResponse> getAllTickets() {
        User currentUser = authService.getCurrentUser();
        if (currentUser.getRole() == Role.USER) {
            return ticketRepository.findByReporterIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                    .map(t -> toResponse(t, currentUser))
                    .collect(Collectors.toList());
        }
        return ticketRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(t -> toResponse(t, currentUser))
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getMyTickets() {
        User currentUser = authService.getCurrentUser();
        return ticketRepository.findByReporterIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(t -> toResponse(t, currentUser))
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getAssignedTickets() {
        User currentUser = authService.getCurrentUser();
        return ticketRepository.findByAssigneeIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(t -> toResponse(t, currentUser))
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getTicketsByStatus(TicketStatus status) {
        User currentUser = authService.getCurrentUser();
        return ticketRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(t -> toResponse(t, currentUser))
                .collect(Collectors.toList());
    }

    public TicketResponse getTicketById(Long id) {
        User currentUser = authService.getCurrentUser();
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        boolean isAdminOrTechnician = currentUser.getRole() == Role.ADMIN
                || currentUser.getRole() == Role.TECHNICIAN;
        boolean isReporter = ticket.getReporter() != null
                && ticket.getReporter().getId().equals(currentUser.getId());
        if (!isAdminOrTechnician && !isReporter) {
            throw new RuntimeException("Not authorized to view this ticket");
        }
        return toResponse(ticket, currentUser);
    }

    public List<User> getTechnicians() {
        return userRepository.findByRole(Role.TECHNICIAN);
    }

    public Map<String, Object> getTicketStats() {
        User currentUser = authService.getCurrentUser();

        List<Ticket> tickets = currentUser.getRole() == Role.TECHNICIAN
                ? ticketRepository.findByAssigneeIdOrderByCreatedAtDesc(currentUser.getId())
                : ticketRepository.findAllByOrderByCreatedAtDesc();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", tickets.size());
        stats.put("open", tickets.stream().filter(t -> t.getStatus() == TicketStatus.OPEN).count());
        stats.put("inProgress", tickets.stream().filter(t -> t.getStatus() == TicketStatus.IN_PROGRESS).count());
        stats.put("resolved", tickets.stream().filter(t -> t.getStatus() == TicketStatus.RESOLVED).count());
        stats.put("closed", tickets.stream().filter(t -> t.getStatus() == TicketStatus.CLOSED).count());
        stats.put("rejected", tickets.stream().filter(t -> t.getStatus() == TicketStatus.REJECTED).count());

        Map<String, Long> byCategory = tickets.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getCategory() != null ? t.getCategory() : "OTHER",
                        Collectors.counting()));
        stats.put("byCategory", byCategory);

        Map<String, Long> byPriority = tickets.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getPriority().name(),
                        Collectors.counting()));
        stats.put("byPriority", byPriority);

        double avgResolutionHours = tickets.stream()
                .filter(t -> t.getResolvedAt() != null && t.getCreatedAt() != null)
                .mapToLong(t -> Duration.between(t.getCreatedAt(), t.getResolvedAt()).toHours())
                .average()
                .orElse(0);
        stats.put("avgResolutionHours", Math.round(avgResolutionHours));

        return stats;
    }

    public List<TicketResponse> searchTickets(String q, String status, String category, String priority) {
        User currentUser = authService.getCurrentUser();

        TicketStatus statusEnum = (status != null && !status.isBlank()) ? TicketStatus.valueOf(status) : null;
        Priority priorityEnum = (priority != null && !priority.isBlank()) ? Priority.valueOf(priority) : null;
        String categoryVal = (category != null && !category.isBlank()) ? category : null;
        String qVal = (q != null && !q.isBlank()) ? q : null;

        List<Ticket> tickets;
        if (currentUser.getRole() == Role.USER) {
            tickets = ticketRepository.searchMyTickets(
                    currentUser.getId(), statusEnum, categoryVal, priorityEnum, qVal);
        } else {
            tickets = ticketRepository.searchTickets(statusEnum, categoryVal, priorityEnum, qVal);
        }

        return tickets.stream()
                .map(t -> toResponse(t, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional
    public TicketResponse updateStatus(Long id, UpdateStatusRequest request) {
        User currentUser = authService.getCurrentUser();

        if (currentUser.getRole() == Role.USER) {
            throw new RuntimeException("Not authorized to update ticket status");
        }

        if (currentUser.getRole() == Role.TECHNICIAN &&
                request.getStatus() != TicketStatus.IN_PROGRESS &&
                request.getStatus() != TicketStatus.RESOLVED) {
            throw new RuntimeException("Technicians can only set status to IN_PROGRESS or RESOLVED");
        }

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (currentUser.getRole() == Role.TECHNICIAN) {
            if (ticket.getAssignee() == null ||
                    !ticket.getAssignee().getId().equals(currentUser.getId())) {
                throw new RuntimeException("You can only update tickets assigned to you");
            }
        }

        TicketStatus newStatus = request.getStatus();
        ticket.setStatus(newStatus);

        if (request.getResolutionNotes() != null) {
            ticket.setResolutionNotes(request.getResolutionNotes());
        }
        if (newStatus == TicketStatus.REJECTED && request.getRejectionReason() != null) {
            ticket.setRejectionReason(request.getRejectionReason());
        }
        if (newStatus == TicketStatus.RESOLVED) {
            ticket.setResolvedAt(LocalDateTime.now());
        }
        if (newStatus == TicketStatus.IN_PROGRESS && ticket.getInProgressAt() == null) {
            ticket.setInProgressAt(LocalDateTime.now());
        }
        if (newStatus == TicketStatus.CLOSED) {
            ticket.setClosedAt(LocalDateTime.now());
        }
        if (newStatus == TicketStatus.REJECTED) {
            ticket.setRejectedAt(LocalDateTime.now());
        }

        Ticket saved = ticketRepository.save(ticket);

        // In-app notification to reporter
        if (ticket.getReporter() != null) {
            Notification n = new Notification(
                    ticket.getReporter(),
                    "Ticket #" + id + " Updated",
                    "Your ticket '" + ticket.getTitle() + "' status changed to " + newStatus,
                    "TICKET"
            );
            n.setReferenceType("TICKET");
            n.setReferenceId(id);
            notificationRepository.save(n);
        }

        // Push notification (FCM via SNS) — non-blocking
        try {
            if (ticket.getReporter() != null) {
                String statusLabel = newStatus != null ? newStatus.name() : "Updated";
                pushNotificationService.sendToUser(
                        ticket.getReporter(),
                        "Ticket " + statusLabel,
                        "Your ticket '" + ticket.getTitle() + "' status changed to " + statusLabel
                );
            }
        } catch (Exception e) {
            System.err.println("[Push] Ticket status push failed: " + e.getMessage());
        }

        // If technician resolved -> notify all admins
        if (newStatus == TicketStatus.RESOLVED && currentUser.getRole() == Role.TECHNICIAN) {
            userRepository.findByRole(Role.ADMIN).forEach(admin -> {
                Notification n = new Notification(
                        admin,
                        "Ticket #" + id + " Resolved",
                        currentUser.getFirstName() + " " + currentUser.getLastName()
                                + " resolved ticket '" + ticket.getTitle() + "'",
                        "TICKET"
                );
                n.setReferenceType("TICKET");
                n.setReferenceId(id);
                notificationRepository.save(n);
            });
        }

        return toResponse(saved, currentUser);
    }

    @Transactional
    public TicketResponse updatePriority(Long id, String priority) {
        User currentUser = authService.getCurrentUser();
        if (currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only admins can change ticket priority");
        }
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        ticket.setPriority(Priority.valueOf(priority.toUpperCase()));
        return toResponse(ticketRepository.save(ticket), currentUser);
    }

    @Transactional
    public TicketResponse assignTicket(Long id, Long assigneeId) {
        User currentUser = authService.getCurrentUser();
        if (currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only admins can assign tickets");
        }
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (assignee.getRole() != Role.TECHNICIAN) {
            throw new RuntimeException("Can only assign tickets to technicians");
        }

        ticket.setAssignee(assignee);
        ticket.setAssignedAt(LocalDateTime.now());
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
            if (ticket.getInProgressAt() == null) ticket.setInProgressAt(LocalDateTime.now());
        }

        Ticket saved = ticketRepository.save(ticket);

        Notification n = new Notification(
                assignee,
                "Ticket Assigned",
                "You have been assigned to ticket '" + ticket.getTitle() + "'",
                "TICKET"
        );
        n.setReferenceType("TICKET");
        n.setReferenceId(id);
        notificationRepository.save(n);

        return toResponse(saved, currentUser);
    }

    @Transactional
    public void deleteTicket(Long id) {
        User currentUser = authService.getCurrentUser();
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isReporter = ticket.getReporter() != null
                && ticket.getReporter().getId().equals(currentUser.getId());

        if (!isAdmin && !isReporter) {
            throw new RuntimeException("Not authorized to delete this ticket");
        }
        ticketRepository.deleteById(id);
    }

    private TicketResponse toResponse(Ticket t, User currentUser) {
        TicketResponse res = new TicketResponse();
        res.setId(t.getId());
        res.setTitle(t.getTitle());
        res.setDescription(t.getDescription());
        res.setCategory(t.getCategory());
        res.setLocation(t.getLocation());
        res.setContactDetails(t.getContactDetails());
        res.setStatus(t.getStatus());
        res.setPriority(t.getPriority());
        res.setResolutionNotes(t.getResolutionNotes());
        res.setRejectionReason(t.getRejectionReason());
        res.setResolvedAt(t.getResolvedAt());
        res.setAssignedAt(t.getAssignedAt());
        res.setInProgressAt(t.getInProgressAt());
        res.setClosedAt(t.getClosedAt());
        res.setRejectedAt(t.getRejectedAt());
        res.setCreatedAt(t.getCreatedAt());
        res.setUpdatedAt(t.getUpdatedAt());
        res.setFacilityId(t.getFacilityId());

        // Resolution time
        if (t.getResolvedAt() != null && t.getCreatedAt() != null) {
            res.setResolutionTimeHours(
                    Duration.between(t.getCreatedAt(), t.getResolvedAt()).toHours());
        }

        // Escalation flag
        res.setEscalated(t.getLastEscalatedAt() != null);

        if (t.getImageUrls() != null && !t.getImageUrls().isBlank()) {
            res.setImageUrls(Arrays.asList(t.getImageUrls().split(",")));
        } else {
            res.setImageUrls(new ArrayList<>());
        }

        if (t.getReporter() != null) {
            res.setReporterId(t.getReporter().getId());
            res.setReporterName(t.getReporter().getFirstName() + " " + t.getReporter().getLastName());
            res.setReporterEmail(t.getReporter().getEmail());
        }
        if (t.getAssignee() != null) {
            res.setAssigneeId(t.getAssignee().getId());
            res.setAssigneeName(t.getAssignee().getFirstName() + " " + t.getAssignee().getLastName());
        }
        return res;
    }
}
