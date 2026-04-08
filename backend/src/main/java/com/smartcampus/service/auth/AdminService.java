package com.smartcampus.service.auth;

import com.smartcampus.dto.auth.UserResponse;
import com.smartcampus.enums.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;

    public AdminService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
            .map(this::mapToUserResponse)
            .collect(Collectors.toList());
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToUserResponse(user);
    }

    public UserResponse updateUserRole(Long id, String role) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setRole(Role.valueOf(role.toUpperCase()));
        userRepository.save(user);
        
        return mapToUserResponse(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public List<UserResponse> getTechnicians() {
        return userRepository.findAll().stream()
            .filter(u -> u.getRole() == Role.TECHNICIAN)
            .map(this::mapToUserResponse)
            .collect(Collectors.toList());
    }

    // Get users pending approval (enabled = false)
    public List<UserResponse> getPendingUsers() {
        return userRepository.findAll().stream()
            .filter(u -> !u.isEnabled())
            .map(this::mapToUserResponse)
            .collect(Collectors.toList());
    }

    // Approve a user (enable their account)
    public UserResponse approveUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setEnabled(true);
        userRepository.save(user);
        
        return mapToUserResponse(user);
    }

    // Reject a user (delete their account)
    public void rejectUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Optionally, you could also just disable them instead of deleting
        // For now, we'll delete them
        userRepository.delete(user);
    }

    // Enable a user (allow them to login)
    public UserResponse enableUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setEnabled(true);
        userRepository.save(user);
        
        return mapToUserResponse(user);
    }

    // Disable a user (prevent them from logging in)
    public UserResponse disableUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setEnabled(false);
        userRepository.save(user);
        
        return mapToUserResponse(user);
    }

    // Get user statistics for analytics
    public Map<String, Object> getUserStats() {
        List<User> allUsers = userRepository.findAll();
        
        long totalUsers = allUsers.size();
        long enabledUsers = allUsers.stream().filter(User::isEnabled).count();
        long pendingUsers = allUsers.stream().filter(u -> !u.isEnabled()).count();
        long adminCount = allUsers.stream().filter(u -> u.getRole() == Role.ADMIN).count();
        long technicianCount = allUsers.stream().filter(u -> u.getRole() == Role.TECHNICIAN).count();
        long userCount = allUsers.stream().filter(u -> u.getRole() == Role.USER).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("enabledUsers", enabledUsers);
        stats.put("pendingUsers", pendingUsers);
        stats.put("adminCount", adminCount);
        stats.put("technicianCount", technicianCount);
        stats.put("userCount", userCount);

        return stats;
    }

    private UserResponse mapToUserResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getPhoneNumber(),
            user.getRole(),
            user.isEnabled(),
            user.getCreatedAt(),
            user.getProfileImageUrl()
        );
    }
}
