package com.smartcampus.repository;

import com.smartcampus.model.ChatGroup;
import com.smartcampus.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatGroupRepository extends JpaRepository<ChatGroup, Long> {
    
    List<ChatGroup> findByMembersContaining(User user);
    
    List<ChatGroup> findByBroadcastOnlyTrue();
    
    Optional<ChatGroup> findByName(String name);
}
