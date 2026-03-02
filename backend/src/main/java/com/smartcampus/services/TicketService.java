package com.smartcampus.services;

import com.smartcampus.dto.ticket.TicketDTO;
import com.smartcampus.dto.ticket.TicketRequest;
import com.smartcampus.entity.Ticket;
import com.smartcampus.enums.TicketStatus;
import com.smartcampus.model.Facility;
import com.smartcampus.model.Notification;
import com.smartcampus.model.User;
import com.smartcampus.repository.FacilityRepository;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.auth.AuthService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final FacilityRepository facilityRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final AuthService authService;

    public TicketService(TicketRepository ticketRepository,
                        FacilityRepository facilityRepository,
                        UserRepository userRepository,
                        NotificationRepository notificationRepository,
                        AuthService authService) {
        this.ticketRepository = ticketRepository;
        this.facilityRepository = facilityRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.authService = authService;
    }

    public List<TicketDTO> getAllTickets() {
        return ticketRepository.findAll().stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public List<TicketDTO> getUserTickets() {
        User currentUser = authService.getCurrentUser();
        return ticketRepository.findByReporterId(currentUser.getId()).stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public List<TicketDTO> getAssignedTickets() {
        User currentUser = authService.getCurrentUser();
        return ticketRepository.findByAssigneeId(currentUser.getId()).stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public List<TicketDTO> getTicketsByStatus(TicketStatus status) {
        return ticketRepository.findByStatus(status).stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public TicketDTO getTicketById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));
        return mapToDTO(ticket);
    }

    @Transactional
    public TicketDTO createTicket(TicketRequest request) {
        User currentUser = authService.getCurrentUser();

        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setCategory(request.getCategory());
        ticket.setPriority(request.getPriority());
        ticket.setReporter(currentUser);
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setAttachmentUrl(request.getAttachmentUrl());
        ticket.setCreatedAt(LocalDateTime.now());

        if (request.getFacilityId() != null) {
            Facility facility = facilityRepository.findById(request.getFacilityId())
                .orElseThrow(() -> new RuntimeException("Facility not found"));
            ticket.setFacility(facility);
        }

        ticket = ticketRepository.save(ticket);
        return mapToDTO(ticket);
    }

    @Transactional
    public TicketDTO assignTicket(Long id, Long assigneeId) {
        Ticket ticket = ticketRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User assignee = userRepository.findById(assigneeId)
            .orElseThrow(() -> new RuntimeException("Assignee not found"));

        ticket.setAssignee(assignee);
        ticket.setUpdatedAt(LocalDateTime.now());

        ticket = ticketRepository.save(ticket);

        // Notify assignee
        createNotification(assignee, "Ticket Assigned", 
            "You have been assigned to ticket: " + ticket.getTitle(), "TICKET");

        return mapToDTO(ticket);
    }

    @Transactional
    public TicketDTO updateStatus(Long id, TicketStatus status) {
        Ticket ticket = ticketRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));

        ticket.setStatus(status);
        ticket.setUpdatedAt(LocalDateTime.now());

        if (status == TicketStatus.RESOLVED) {
            ticket.setResolvedAt(LocalDateTime.now());
        }

        ticket = ticketRepository.save(ticket);

        // Notify reporter
        createNotification(ticket.getReporter(), "Ticket Status Updated", 
            "Your ticket '" + ticket.getTitle() + "' status changed to: " + status, "TICKET");

        return mapToDTO(ticket);
    }

    @Transactional
    public TicketDTO addResolution(Long id, String resolutionNotes) {
        Ticket ticket = ticketRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));

        ticket.setResolutionNotes(resolutionNotes);
        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());

        ticket = ticketRepository.save(ticket);

        // Notify reporter
        createNotification(ticket.getReporter(), "Ticket Resolved", 
            "Your ticket '" + ticket.getTitle() + "' has been resolved", "TICKET");

        return mapToDTO(ticket);
    }

    @Transactional
    public void deleteTicket(Long id) {
        ticketRepository.deleteById(id);
    }

    private void createNotification(User user, String title, String message, String type) {
        Notification notification = new Notification(user, title, message, type);
        notificationRepository.save(notification);
    }

    private TicketDTO mapToDTO(Ticket ticket) {
        TicketDTO dto = new TicketDTO();
        dto.setId(ticket.getId());
        dto.setTitle(ticket.getTitle());
        dto.setDescription(ticket.getDescription());
        dto.setCategory(ticket.getCategory());
        dto.setPriority(ticket.getPriority());
        dto.setStatus(ticket.getStatus());
        dto.setResolutionNotes(ticket.getResolutionNotes());
        dto.setAttachmentUrl(ticket.getAttachmentUrl());
        dto.setCreatedAt(ticket.getCreatedAt());
        dto.setUpdatedAt(ticket.getUpdatedAt());
        dto.setResolvedAt(ticket.getResolvedAt());

        if (ticket.getReporter() != null) {
            dto.setReporterId(ticket.getReporter().getId());
            dto.setReporterEmail(ticket.getReporter().getEmail());
            dto.setReporterName(ticket.getReporter().getFirstName() + " " + ticket.getReporter().getLastName());
        }

        if (ticket.getAssignee() != null) {
            dto.setAssigneeId(ticket.getAssignee().getId());
            dto.setAssigneeName(ticket.getAssignee().getFirstName() + " " + ticket.getAssignee().getLastName());
        }

        if (ticket.getFacility() != null) {
            dto.setFacilityId(ticket.getFacility().getId());
            dto.setFacilityName(ticket.getFacility().getName());
        }

        return dto;
    }
}

