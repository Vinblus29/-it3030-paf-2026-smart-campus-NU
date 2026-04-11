package com.smartcampus.controller.ticket;

import com.smartcampus.dto.ticket.TicketRequest;
import com.smartcampus.dto.ticket.TicketResponse;
import com.smartcampus.dto.ticket.UpdateStatusRequest;
import com.smartcampus.enums.TicketStatus;
import com.smartcampus.service.ticket.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin
public class TicketController {

    private final TicketService service;

    public TicketController(TicketService service) {
        this.service = service;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public TicketResponse create(
            @Valid @RequestPart("ticket") TicketRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        return service.createTicket(request, images);
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return service.getTicketStats();
    }

    @GetMapping("/search")
    public List<TicketResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String priority) {
        return service.searchTickets(q, status, category, priority);
    }

    @GetMapping
    public List<TicketResponse> getAll() {
        return service.getAllTickets();
    }

    @GetMapping("/{id}")
    public TicketResponse getById(@PathVariable Long id) {
        return service.getTicketById(id);
    }

    @GetMapping("/my-tickets")
    public List<TicketResponse> getMyTickets() {
        return service.getMyTickets();
    }

    @GetMapping("/assigned")
    public List<TicketResponse> getAssignedTickets() {
        return service.getAssignedTickets();
    }

    @GetMapping("/status/{status}")
    public List<TicketResponse> getByStatus(@PathVariable TicketStatus status) {
        return service.getTicketsByStatus(status);
    }

    @GetMapping("/technicians")
    public List<Map<String, Object>> getTechnicians() {
        return service.getTechnicians().stream().map(u -> Map.of(
                "id", (Object) u.getId(),
                "name", u.getFirstName() + " " + u.getLastName(),
                "email", u.getEmail()
        )).collect(Collectors.toList());
    }

    @PutMapping("/{id}/status")
    public TicketResponse updateStatus(@PathVariable Long id,
                                       @RequestBody UpdateStatusRequest request) {
        return service.updateStatus(id, request);
    }

    @PutMapping("/{id}/priority")
    public TicketResponse updatePriority(@PathVariable Long id,
                                         @RequestBody Map<String, String> body) {
        return service.updatePriority(id, body.get("priority"));
    }

    @PutMapping("/{id}/assign")
    public TicketResponse assign(@PathVariable Long id,
                                 @RequestBody Map<String, Long> body) {
        return service.assignTicket(id, body.get("assigneeId"));
    }

    @GetMapping("/{id}/activity")
    public List<Map<String, Object>> getActivity(@PathVariable Long id) {
        TicketResponse t = service.getTicketById(id);
        List<Map<String, Object>> timeline = new java.util.ArrayList<>();
        if (t.getCreatedAt() != null)
            timeline.add(Map.of("action", "CREATED", "detail", "Ticket submitted", "createdAt", t.getCreatedAt()));
        if (t.getAssignedAt() != null)
            timeline.add(Map.of("action", "ASSIGNED", "detail",
                t.getAssigneeName() != null ? "Assigned to " + t.getAssigneeName() : "Ticket assigned",
                "createdAt", t.getAssignedAt()));
        if (t.getInProgressAt() != null)
            timeline.add(Map.of("action", "STATUS_CHANGED", "detail", "Status changed to In Progress", "createdAt", t.getInProgressAt()));
        if (t.getResolvedAt() != null)
            timeline.add(Map.of("action", "STATUS_CHANGED", "detail", "Ticket resolved", "createdAt", t.getResolvedAt()));
        if (t.getClosedAt() != null)
            timeline.add(Map.of("action", "STATUS_CHANGED", "detail", "Ticket closed", "createdAt", t.getClosedAt()));
        if (t.getRejectedAt() != null)
            timeline.add(Map.of("action", "STATUS_CHANGED", "detail",
                t.getRejectionReason() != null ? "Ticket rejected: " + t.getRejectionReason() : "Ticket rejected",
                "createdAt", t.getRejectedAt()));
        timeline.sort(java.util.Comparator.comparing(m -> (java.time.LocalDateTime) m.get("createdAt")));
        return timeline;
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteTicket(id);
    }
}
