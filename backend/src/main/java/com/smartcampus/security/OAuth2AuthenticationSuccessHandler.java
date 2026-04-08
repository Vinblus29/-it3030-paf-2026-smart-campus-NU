package com.smartcampus.security;

import com.smartcampus.dto.auth.AuthResponse;
import com.smartcampus.dto.auth.UserResponse;
import com.smartcampus.enums.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.security.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.oauth2.redirect-base-url:http://localhost:5173}")
    private String redirectBaseUrl;

    public OAuth2AuthenticationSuccessHandler(UserRepository userRepository, 
                                               JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, 
                                        HttpServletResponse response, 
                                        Authentication authentication) throws IOException, ServletException {
        
        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            OAuth2User oAuth2User = oauthToken.getPrincipal();
            
            String email = oAuth2User.getAttribute("email");
            if (email == null) {
                email = oAuth2User.getAttribute("preferred_username");
            }
            
            String name = oAuth2User.getAttribute("name");
            String firstName = "";
            String lastName = "";
            
            if (name != null && !name.isEmpty()) {
                String[] parts = name.split(" ", 2);
                firstName = parts[0];
                lastName = parts.length > 1 ? parts[1] : "";
            }

            // Find or create user
            User user = userRepository.findByEmail(email).orElse(null);
            
            if (user == null) {
                // Create new user
                user = new User();
                user.setEmail(email);
                user.setFirstName(firstName);
                user.setLastName(lastName);
                user.setRole(Role.USER);
                user.setEnabled(true); // OAuth users are auto-enabled
                user.setCreatedAt(LocalDateTime.now());
                user.setPassword("OAUTH2_USER_" + System.currentTimeMillis()); // Random password for OAuth users
                
                userRepository.save(user);
            }

            // Generate JWT token
            String token = jwtTokenProvider.generateToken(email);
            
            // Create user response
            UserResponse userResponse = new UserResponse(
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

            // Redirect with token
            String redirectUrl = redirectBaseUrl + "/oauth2/callback?token=" + token + 
                                "&userId=" + user.getId() +
                                "&email=" + user.getEmail() +
                                "&firstName=" + user.getFirstName() +
                                "&lastName=" + user.getLastName() +
                                "&role=" + user.getRole();
            
            response.sendRedirect(redirectUrl);
        } else {
            response.sendRedirect(redirectBaseUrl + "/login?error=oauth_failed");
        }
    }
}

