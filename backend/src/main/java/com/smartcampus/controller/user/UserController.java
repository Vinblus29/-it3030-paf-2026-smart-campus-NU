package com.smartcampus.controller.user;

import com.smartcampus.dto.auth.UserResponse;
import com.smartcampus.service.auth.AdminService;
import com.smartcampus.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> searchUsers(@RequestParam String query) {
        String q = "%" + query.toLowerCase() + "%";
        return ResponseEntity.ok(userRepository.searchUsers(q).stream()
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getEmail(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getPhoneNumber(),
                        user.getRole(),
                        user.isEnabled(),
                        user.getCreatedAt(),
                        user.getProfileImageUrl()
                ))
                .collect(Collectors.toList()));
    }
}
