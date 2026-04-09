package com.smartcampus.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

@Configuration
public class DatabaseMigrationConfig {

    @Bean
    CommandLineRunner migrateDatabase(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                System.out.println("Checking for missing columns in 'bookings' table...");
                
                // Add 'waitlisted' column if it doesn't exist
                jdbcTemplate.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS waitlisted BOOLEAN DEFAULT FALSE");
                System.out.println("Column 'waitlisted' verified/added to 'bookings' table.");

                // Check other potentially missing columns from recent updates
                jdbcTemplate.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS qr_token VARCHAR(255)");
                jdbcTemplate.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(50)");
                jdbcTemplate.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurring_group_id VARCHAR(255)");
                
                System.out.println("Database migration check completed successfully.");
            } catch (Exception e) {
                System.err.println("Database migration failed: " + e.getMessage());
                // Don't throw exception to avoid app crash on startup if it already exists or other issues
            }
        };
    }
}
