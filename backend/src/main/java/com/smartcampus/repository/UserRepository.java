package com.smartcampus.repository;

import com.smartcampus.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    Optional<User> findByVerificationToken(String token);
    
    Optional<User> findByResetToken(String token);
    
    Optional<User> findByOtpCode(String otpCode);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE " +
           "LOWER(u.firstName) LIKE LOWER(:query) OR " +
           "LOWER(u.lastName) LIKE LOWER(:query) OR " +
           "LOWER(u.email) LIKE LOWER(:query)")
    java.util.List<User> searchUsers(@org.springframework.data.repository.query.Param("query") String query);
}

