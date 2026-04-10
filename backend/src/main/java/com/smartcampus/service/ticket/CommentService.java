package com.smartcampus.service.ticket;

import com.smartcampus.dto.ticket.CommentRequest;
import com.smartcampus.dto.ticket.CommentResponse;
import com.smartcampus.entity.Ticket;
import com.smartcampus.enums.Role;
import com.smartcampus.model.Comment;
import com.smartcampus.model.Notification;
import com.smartcampus.model.User;
import com.smartcampus.repository.CommentRepository;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.service.auth.AuthService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final NotificationRepository notificationRepository;
    private final AuthService authService;

    public CommentService(CommentRepository commentRepository, TicketRepository ticketRepository,
                          NotificationRepository notificationRepository, AuthService authService) {
        this.commentRepository = commentRepository;
        this.ticketRepository = ticketRepository;
        this.notificationRepository = notificationRepository;
        this.authService = authService;
    }

    public List<CommentResponse> getComments(Long ticketId) {
        User currentUser = authService.getCurrentUser();
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        boolean isAdminOrTechnician = currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.TECHNICIAN;
        boolean isReporter = ticket.getReporter() != null && ticket.getReporter().getId().equals(currentUser.getId());
        if (!isAdminOrTechnician && !isReporter) {
            throw new RuntimeException("Not authorized to view comments on this ticket");
        }
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
                .map(c -> toResponse(c, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse addComment(Long ticketId, CommentRequest request) {
        User currentUser = authService.getCurrentUser();
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        Comment comment = new Comment(ticket, currentUser, request.getContent());
        CommentResponse saved = toResponse(commentRepository.save(comment), currentUser);

        // Notify reporter if commenter is not the reporter
        if (ticket.getReporter() != null && !ticket.getReporter().getId().equals(currentUser.getId())) {
            Notification n = new Notification(
                    ticket.getReporter(),
                    "New comment on Ticket #" + ticketId,
                    currentUser.getFirstName() + " " + currentUser.getLastName() + " commented: " + request.getContent(),
                    "TICKET"
            );
            n.setReferenceType("TICKET");
            n.setReferenceId(ticketId);
            notificationRepository.save(n);
        }

        // Notify assignee if exists and is not the commenter
        if (ticket.getAssignee() != null && !ticket.getAssignee().getId().equals(currentUser.getId())) {
            Notification n = new Notification(
                    ticket.getAssignee(),
                    "New comment on Ticket #" + ticketId,
                    currentUser.getFirstName() + " " + currentUser.getLastName() + " commented: " + request.getContent(),
                    "TICKET"
            );
            n.setReferenceType("TICKET");
            n.setReferenceId(ticketId);
            notificationRepository.save(n);
        }

        return saved;
    }

    @Transactional
    public CommentResponse editComment(Long commentId, CommentRequest request) {
        User currentUser = authService.getCurrentUser();
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Not authorized to edit this comment");
        }

        comment.setContent(request.getContent());
        comment.setUpdatedAt(LocalDateTime.now());
        return toResponse(commentRepository.save(comment), currentUser);
    }

    @Transactional
    public void deleteComment(Long commentId) {
        User currentUser = authService.getCurrentUser();
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        boolean isOwner = comment.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("Not authorized to delete this comment");
        }
        commentRepository.deleteById(commentId);
    }

    private CommentResponse toResponse(Comment c, User currentUser) {
        CommentResponse res = new CommentResponse();
        res.setId(c.getId());
        res.setTicketId(c.getTicket().getId());
        res.setUserId(c.getUser().getId());
        res.setUserName(c.getUser().getFirstName() + " " + c.getUser().getLastName());
        res.setUserEmail(c.getUser().getEmail());
        res.setContent(c.getContent());
        res.setCreatedAt(c.getCreatedAt());
        res.setUpdatedAt(c.getUpdatedAt());

        boolean isOwner = c.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        res.setCanEdit(isOwner);
        res.setCanDelete(isOwner || isAdmin);
        return res;
    }
}
