package com.smartcampus.controller.chat;

import com.smartcampus.dto.chat.ChatMessageDto;
import com.smartcampus.dto.chat.ChatGroupDto;
import com.smartcampus.dto.auth.UserResponse;
import com.smartcampus.model.User;
import com.smartcampus.service.chat.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.smartcampus.service.auth.AuthService;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    
    private final ChatService chatService;
    private final AuthService authService;

    public ChatController(ChatService chatService, AuthService authService) {
        this.chatService = chatService;
        this.authService = authService;
    }

    @PostMapping("/direct")
    public ResponseEntity<ChatMessageDto> sendDirect(@RequestBody ChatMessageDto request) {
        User sender = authService.getCurrentUser();
        return ResponseEntity.ok(chatService.sendDirectMessage(sender, request.getRecipientId(), request.getContent(), request.getAttachmentUrl()));
    }

    @PostMapping("/broadcast")
    public ResponseEntity<ChatMessageDto> sendBroadcast(@RequestBody ChatMessageDto request) {
        User sender = authService.getCurrentUser();
        return ResponseEntity.ok(chatService.sendGroupBroadcast(sender, request.getGroupId(), request.getContent()));
    }

    @GetMapping("/conversation/{otherUserId}")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<List<ChatMessageDto>> getConversation(@PathVariable Long otherUserId) {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(chatService.getConversation(currentUser, otherUserId));
    }

    @GetMapping("/group/{groupId}")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<List<ChatMessageDto>> getGroupMessages(@PathVariable Long groupId) {
        return ResponseEntity.ok(chatService.getGroupMessages(groupId));
    }


    @GetMapping("/groups")
    public ResponseEntity<List<ChatGroupDto>> getMyGroups() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(chatService.getUserGroups(user));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<UserResponse>> getRecentChats() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(chatService.getRecentChatUsers(user));
    }

    @PostMapping("/upload-attachment")
    public ResponseEntity<String> uploadAttachment(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity.ok(chatService.uploadAttachment(file));
    }
}
