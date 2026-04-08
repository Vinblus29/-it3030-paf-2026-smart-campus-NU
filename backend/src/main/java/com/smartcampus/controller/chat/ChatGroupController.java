package com.smartcampus.controller.chat;

import com.smartcampus.dto.chat.ChatGroupDto;
import com.smartcampus.model.ChatGroup;
import com.smartcampus.model.User;
import com.smartcampus.repository.ChatGroupRepository;
import com.smartcampus.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat/groups")
public class ChatGroupController {
    
    private final ChatGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final com.smartcampus.service.auth.AuthService authService;

    public ChatGroupController(ChatGroupRepository groupRepository, UserRepository userRepository, com.smartcampus.service.auth.AuthService authService) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.authService = authService;
    }



    @GetMapping("/all")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<List<ChatGroupDto>> getAllGroups() {
        return ResponseEntity.ok(groupRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList()));
    }

    @PostMapping("/{groupId}/join")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ChatGroupDto> joinGroup(@PathVariable Long groupId) {
        User user = authService.getCurrentUser();
        ChatGroup group = groupRepository.findById(groupId).orElseThrow();
        group.getMembers().add(user);
        return ResponseEntity.ok(mapToDto(groupRepository.save(group)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ChatGroupDto> createGroup(@RequestBody ChatGroupDto request) {
        ChatGroup group = new ChatGroup(request.getName(), request.getDescription(), request.isBroadcastOnly());
        return ResponseEntity.ok(mapToDto(groupRepository.save(group)));
    }

    private ChatGroupDto mapToDto(ChatGroup g) {
        ChatGroupDto dto = new ChatGroupDto();
        dto.setId(g.getId());
        dto.setName(g.getName());
        dto.setDescription(g.getDescription());
        dto.setBroadcastOnly(g.isBroadcastOnly());
        dto.setMemberIds(g.getMembers().stream().map(User::getId).collect(Collectors.toList()));
        return dto;
    }
}
