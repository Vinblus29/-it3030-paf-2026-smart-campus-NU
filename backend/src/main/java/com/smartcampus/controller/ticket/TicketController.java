package com.smartcampus.controller.ticket;

import com.smartcampus.dto.ticket.TicketDTO;
import com.smartcampus.dto.ticket.TicketRequest;
import com.smartcampus.enums.TicketStatus;
import com.smartcampus.services.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping
    public ResponseEntity<List<TicketDTO>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @GetMapping("/my-tickets")
    public ResponseEntity<List<TicketDTO>> getUserTickets() {
        return ResponseEntity.ok(ticketService.getUserTickets());
    }

    @GetMapping("/assigned")
    public ResponseEntity<List<TicketDTO>> getAssignedTickets() {
        return ResponseEntity.ok(ticketService.getAssignedTickets());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<TicketDTO>> getTicketsByStatus(@PathVariable TicketStatus status) {
        return ResponseEntity.ok(ticketService.getTicketsByStatus(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketDTO> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @PostMapping
    public ResponseEntity<TicketDTO> createTicket(@Valid @RequestBody TicketRequest request) {
        return ResponseEntity.ok(ticketService.createTicket(request));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<TicketDTO> assignTicket(@PathVariable Long id, @RequestParam Long assigneeId) {
        return ResponseEntity.ok(ticketService.assignTicket(id, assigneeId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<TicketDTO> updateStatus(@PathVariable Long id, @RequestParam TicketStatus status) {
        return ResponseEntity.ok(ticketService.updateStatus(id, status));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<TicketDTO> addResolution(@PathVariable Long id, @RequestParam String resolutionNotes) {
        return ResponseEntity.ok(ticketService.addResolution(id, resolutionNotes));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(@PathVariable Long id) {
        ticketService.deleteTicket(id);
        return ResponseEntity.ok().build();
    }
}

