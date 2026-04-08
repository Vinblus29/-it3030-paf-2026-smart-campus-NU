package com.smartcampus.repository;

import com.smartcampus.model.ChatMessage;
import com.smartcampus.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatRepository extends JpaRepository<ChatMessage, Long> {
    
    @Query("SELECT m FROM ChatMessage m WHERE (m.sender = :user1 AND m.recipient = :user2) OR (m.sender = :user2 AND m.recipient = :user1) ORDER BY m.timestamp ASC")
    List<ChatMessage> findConversation(User user1, User user2);

    List<ChatMessage> findByGroupIdOrderByTimestampAsc(Long groupId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.recipient = :user AND m.read = false")
    long countUnreadMessages(User user);
}
