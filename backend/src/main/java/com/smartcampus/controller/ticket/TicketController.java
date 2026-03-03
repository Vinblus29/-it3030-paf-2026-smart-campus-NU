package com.smartcampus.controller.ticket;

import com.smartcampus.dto.ticket.TicketRequest;
import com.smartcampus.dto.ticket.TicketResponse;
import com.smartcampus.dto.ticket.UpdateStatusRequest;
import com.smartcampus.service.ticket.TicketService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin
public class TicketController {

    private final TicketService service;

    public TicketController(TicketService service) {
        this.service = service;
    }

    @PostMapping
    public TicketResponse create(@RequestBody TicketRequest request) {
        return service.createTicket(request);
    }

    @GetMapping
    public List<TicketResponse> getAll() {
        return service.getAllTickets();
    }

    @PutMapping("/{id}/status")
    public TicketResponse updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request) {
        return service.updateStatus(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteTicket(id);
    }
}

