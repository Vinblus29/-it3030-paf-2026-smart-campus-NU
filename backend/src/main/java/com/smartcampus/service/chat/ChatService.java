package com.smartcampus.service.chat;

import com.smartcampus.dto.chat.ChatMessageDto;
import com.smartcampus.dto.chat.ChatGroupDto;
import com.smartcampus.model.ChatMessage;
import com.smartcampus.model.ChatGroup;
import com.smartcampus.model.User;
import com.smartcampus.model.Notification;
import com.smartcampus.repository.ChatRepository;
import com.smartcampus.repository.ChatGroupRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.repository.NotificationRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.smartcampus.service.S3Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {
    
    private final ChatRepository chatRepository;
    private final ChatGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final S3Service s3Service;

    public ChatService(ChatRepository chatRepository, ChatGroupRepository groupRepository, 
                       UserRepository userRepository, NotificationRepository notificationRepository, 
                       SimpMessagingTemplate messagingTemplate, S3Service s3Service) {
        this.chatRepository = chatRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
        this.s3Service = s3Service;
    }

    @Transactional
    public ChatMessageDto sendDirectMessage(User sender, Long recipientId, String content, String attachmentUrl) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        ChatMessage message = new ChatMessage();
        message.setSender(sender);
        message.setRecipient(recipient);
        message.setContent(content);
        message.setAttachmentUrl(attachmentUrl);
        message.setTimestamp(LocalDateTime.now());
        
        ChatMessage saved = chatRepository.save(message);
        ChatMessageDto dto = mapToDto(saved);

        // Send real-time via WebSocket
        messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/messages", dto);
        
        // Also send notification
        createNotification(recipient, "New Message", sender.getFirstName() + " sent you a message.", "CHAT", saved.getId());

        return dto;
    }

    @Transactional
    public ChatMessageDto sendGroupBroadcast(User sender, Long groupId, String content) {
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        if (!sender.getRole().name().equals("ADMIN") && group.isBroadcastOnly()) {
            throw new RuntimeException("Only admins can post in this broadcast group");
        }

        ChatMessage message = new ChatMessage();
        message.setSender(sender);
        message.setGroup(group);
        message.setContent(content);
        message.setTimestamp(LocalDateTime.now());

        ChatMessage saved = chatRepository.save(message);
        ChatMessageDto dto = mapToDto(saved);

        // Broadcast to group topic via WebSocket
        messagingTemplate.convertAndSend("/topic/group/" + group.getId(), dto);

        // Notification for group members (in real app, this should be async)
        group.getMembers().forEach(member -> {
            if (!member.getId().equals(sender.getId())) {
                createNotification(member, "Announcment: " + group.getName(), content, "BROADCAST", saved.getId());
            }
        });

        return dto;
    }

    public List<ChatMessageDto> getConversation(User currentUser, Long otherUserId) {
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return chatRepository.findConversation(currentUser, otherUser).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ChatMessageDto> getGroupMessages(Long groupId) {
        return chatRepository.findByGroupIdOrderByTimestampAsc(groupId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatGroupDto createGroup(ChatGroupDto dto) {
        ChatGroup group = new ChatGroup();
        group.setName(dto.getName());
        group.setDescription(dto.getDescription());
        group.setBroadcastOnly(dto.isBroadcastOnly());
        group.setCreatedAt(LocalDateTime.now());

        if (dto.isIncludeAllUsers()) {
            java.util.Set<User> allUsers = new java.util.HashSet<>(userRepository.findAll());
            group.setMembers(allUsers);
        } else if (dto.getMemberIds() != null && !dto.getMemberIds().isEmpty()) {
            java.util.Set<User> members = new java.util.HashSet<>(userRepository.findAllById(dto.getMemberIds()));
            group.setMembers(members);
        }

        ChatGroup saved = groupRepository.save(group);
        return mapToGroupDto(saved);
    }

    public List<ChatGroupDto> getAllGroups() {
        return groupRepository.findAll().stream()
                .map(this::mapToGroupDto)
                .collect(Collectors.toList());
    }

    public List<ChatGroupDto> getUserGroups(User user) {
        // This assumes groupRepository has a findByUser or similar
        // For now, let's filter manually if no specific repo method exists
        return groupRepository.findAll().stream()
                .filter(g -> g.getMembers().contains(user) || user.getRole().name().equals("ADMIN"))
                .map(this::mapToGroupDto)
                .collect(Collectors.toList());
    }

    private ChatGroupDto mapToGroupDto(ChatGroup g) {
        ChatGroupDto dto = new ChatGroupDto();
        dto.setId(g.getId());
        dto.setName(g.getName());
        dto.setDescription(g.getDescription());
        dto.setBroadcastOnly(g.isBroadcastOnly());
        dto.setMemberIds(g.getMembers().stream().map(User::getId).collect(Collectors.toList()));
        return dto;
    }

    private void createNotification(User user, String title, String message, String type, Long refId) {
        Notification n = new Notification(user, title, message, type);
        n.setReferenceType(type.equals("CHAT") ? "CHAT_MESSAGE" : "GROUP_MESSAGE");
        n.setReferenceId(refId);
        notificationRepository.save(n);
        
        // Send notification unread count via WebSocket
        long count = notificationRepository.countByUserAndReadFalse(user);
        messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/notifications", count);
    }

    private ChatMessageDto mapToDto(ChatMessage m) {
        ChatMessageDto dto = new ChatMessageDto();
        dto.setId(m.getId());
        dto.setSenderId(m.getSender().getId());
        dto.setSenderName(m.getSender().getFirstName() + " " + m.getSender().getLastName());
        dto.setSenderImage(m.getSender().getProfileImageUrl());
        if (m.getRecipient() != null) dto.setRecipientId(m.getRecipient().getId());
        if (m.getGroup() != null) dto.setGroupId(m.getGroup().getId());
        dto.setContent(m.getContent());
        dto.setAttachmentUrl(m.getAttachmentUrl());
        dto.setTimestamp(m.getTimestamp());
        return dto;
    }

    public String uploadAttachment(org.springframework.web.multipart.MultipartFile file) {
        return s3Service.uploadFile(file);
    }
}
