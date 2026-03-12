package com.smartcampus.controller.ticket;

import com.smartcampus.dto.ticket.TicketRequest;
import com.smartcampus.dto.ticket.TicketResponse;
import com.smartcampus.dto.ticket.UpdateStatusRequest;
import com.smartcampus.service.ticket.TicketService;
import com.smartcampus.enums.TicketCategory;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
            @PathVariable @NonNull Long id,
            @RequestBody @NonNull UpdateStatusRequest request) {
        return service.updateStatus(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable @NonNull Long id) {
        service.deleteTicket(id);
    }

    @GetMapping("/category/{category}")
    public List<TicketResponse> getByCategory(@PathVariable @NonNull TicketCategory category) {
        return service.getTicketsByCategory(category);
    }

    @PostMapping("/{id}/upload-image")
    public TicketResponse uploadImage(
            @PathVariable @NonNull Long id,
            @RequestParam @NonNull MultipartFile image) {
        return service.addImageAttachment(id, image);
    }
}

