package com.smartcampus;

import com.smartcampus.enums.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Only seed if database is empty
            if (userRepository.count() == 0) {
                
                // Create ADMIN user
                User admin = new User();
                admin.setEmail("admin@smartuni.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setFirstName("Admin");
                admin.setLastName("User");
                admin.setPhoneNumber("+1234567890");
                admin.setRole(Role.ADMIN);
                admin.setEnabled(true);
                admin.setCreatedAt(LocalDateTime.now());
                userRepository.save(admin);
                
                // Create TECHNICIAN user
                User technician = new User();
                technician.setEmail("technician@smartuni.com");
                technician.setPassword(passwordEncoder.encode("tech123"));
                technician.setFirstName("Technician");
                technician.setLastName("User");
                technician.setPhoneNumber("+1234567891");
                technician.setRole(Role.TECHNICIAN);
                technician.setEnabled(true);
                technician.setCreatedAt(LocalDateTime.now());
                userRepository.save(technician);
                
                // Create regular USER
                User user = new User();
                user.setEmail("user@smartuni.com");
                user.setPassword(passwordEncoder.encode("user123"));
                user.setFirstName("Regular");
                user.setLastName("User");
                user.setPhoneNumber("+1234567892");
                user.setRole(Role.USER);
                user.setEnabled(true);
                user.setCreatedAt(LocalDateTime.now());
                userRepository.save(user);
                
                System.out.println("========================================");
                System.out.println("Database seeded with test users:");
                System.out.println("----------------------------------------");
                System.out.println("ADMIN    | Email: admin@smartuni.com    | Password: admin123");
                System.out.println("TECHNICIAN | Email: technician@smartuni.com | Password: tech123");
                System.out.println("USER     | Email: user@smartuni.com     | Password: user123");
                System.out.println("========================================");
            } else {
                System.out.println("Database already contains users, skipping seeding.");
            }
        };
    }
}

