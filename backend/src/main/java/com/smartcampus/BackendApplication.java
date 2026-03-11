package com.smartcampus;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		// Load .env file from current directory
		Dotenv dotenv = Dotenv.configure()
			.ignoreIfMissing()
			.load();
		
		// Set environment variables from .env file
		if (dotenv != null) {
			dotenv.entries().forEach(entry -> {
				if (System.getProperty(entry.getKey()) == null) {
					System.setProperty(entry.getKey(), entry.getValue());
				}
			});
		}
		
		SpringApplication.run(BackendApplication.class, args);
	}

}
