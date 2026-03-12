package com.smartcampus.service.ticket;

import com.smartcampus.dto.ticket.TicketRequest;
import com.smartcampus.dto.ticket.TicketResponse;
import com.smartcampus.dto.ticket.UpdateStatusRequest;
import com.smartcampus.entity.Ticket;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.enums.TicketCategory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TicketService {

    private final TicketRepository repository;

    public TicketService(TicketRepository repository) {
        this.repository = repository;
    }

    public TicketResponse createTicket(TicketRequest request) {

        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setLocation(request.getLocation());
        ticket.setReportedBy(request.getReportedBy());
        ticket.setPriority(request.getPriority());
        ticket.setCategory(request.getCategory());
        
        if (request.getImageAttachments() != null) {
            ticket.setImageAttachments(request.getImageAttachments());
        }

        Ticket saved = repository.save(ticket);
        return toResponse(saved);
    }


    public List<TicketResponse> getAllTickets() {
        return repository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    
    public TicketResponse updateStatus(@NonNull Long id, @NonNull UpdateStatusRequest request) {

        Ticket ticket = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        ticket.setStatus(request.getStatus());
        ticket.setResolutionNotes(request.getResolutionNotes());

        return toResponse(repository.save(ticket));
    }


    public void deleteTicket(@NonNull Long id) {
        repository.deleteById(id);
    }

    public List<TicketResponse> getTicketsByCategory(TicketCategory category) {
        return repository.findByCategory(category)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public TicketResponse addImageAttachment(@NonNull Long ticketId, @NonNull MultipartFile image) {
        Ticket ticket = repository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        
        // For now, we'll simulate storing the image and returning a URL
        // In a real implementation, you would upload to a file storage service
        String imageUrl = "/uploads/tickets/" + ticketId + "/" + image.getOriginalFilename();
        
        ticket.getImageAttachments().add(imageUrl);
        return toResponse(repository.save(ticket));
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
        res.setCategory(t.getCategory());
        res.setImageAttachments(t.getImageAttachments());
        res.setResolutionNotes(t.getResolutionNotes());
        res.setCreatedAt(t.getCreatedAt());

        return res;
    }
}

