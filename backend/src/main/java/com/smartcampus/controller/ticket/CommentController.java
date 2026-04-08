package com.smartcampus.controller.ticket;

import com.smartcampus.dto.ticket.CommentRequest;
import com.smartcampus.dto.ticket.CommentResponse;
import com.smartcampus.service.ticket.CommentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets/{ticketId}/comments")
@CrossOrigin
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    public List<CommentResponse> getComments(@PathVariable Long ticketId) {
        return commentService.getComments(ticketId);
    }

    @PostMapping
    public CommentResponse addComment(@PathVariable Long ticketId,
                                      @RequestBody CommentRequest request) {
        return commentService.addComment(ticketId, request);
    }

    @PutMapping("/{commentId}")
    public CommentResponse editComment(@PathVariable Long ticketId,
                                       @PathVariable Long commentId,
                                       @RequestBody CommentRequest request) {
        return commentService.editComment(commentId, request);
    }

    @DeleteMapping("/{commentId}")
    public void deleteComment(@PathVariable Long ticketId,
                               @PathVariable Long commentId) {
        commentService.deleteComment(commentId);
    }
}