package com.smartcampus.service.ticket;

import com.smartcampus.dto.ticket.TicketRequest;
import com.smartcampus.dto.ticket.TicketResponse;
import com.smartcampus.dto.ticket.UpdateStatusRequest;
import com.smartcampus.entity.Ticket;
import com.smartcampus.repository.TicketRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TicketService {

    private final TicketRepository repository;
    private final com.smartcampus.service.auth.AuthService authService;

    public TicketService(TicketRepository repository, com.smartcampus.service.auth.AuthService authService) {
        this.repository = repository;
        this.authService = authService;
    }

    public TicketResponse createTicket(TicketRequest request) {
        com.smartcampus.model.User currentUser = authService.getCurrentUser();
        if (!currentUser.isEnabled()) {
            throw new RuntimeException("Account is pending approval. You cannot raise tickets yet.");
        }

        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setLocation(request.getLocation());
        ticket.setReportedBy(request.getReportedBy());
        ticket.setPriority(request.getPriority());

        Ticket saved = repository.save(ticket);
        return toResponse(saved);
    }


    public List<TicketResponse> getAllTickets() {
        return repository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    
    public TicketResponse updateStatus(Long id, UpdateStatusRequest request) {

        Ticket ticket = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        ticket.setStatus(request.getStatus());
        ticket.setResolutionNotes(request.getResolutionNotes());

        return toResponse(repository.save(ticket));
    }


    public List<TicketResponse> getMyTickets() {
        String userEmail = authService.getCurrentUser().getEmail();
        return repository.findByReportedBy(userEmail)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getAssignedTickets() {
        String userEmail = authService.getCurrentUser().getEmail();
        return repository.findByAssignedTo(userEmail)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public void deleteTicket(Long id) {
        repository.deleteById(id);
    }

    private TicketResponse toResponse(Ticket t) {

        TicketResponse res = new TicketResponse();
        res.setId(t.getId());
        res.setTitle(t.getTitle());
        res.setDescription(t.getDescription());
        res.setLocation(t.getLocation());
        res.setReportedBy(t.getReportedBy());
        res.setAssignedTo(t.getAssignedTo());
        res.setStatus(t.getStatus());
        res.setPriority(t.getPriority());
        res.setResolutionNotes(t.getResolutionNotes());
        res.setCreatedAt(t.getCreatedAt());

        return res;
    }
}

