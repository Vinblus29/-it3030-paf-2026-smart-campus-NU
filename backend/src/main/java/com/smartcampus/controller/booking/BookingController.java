package com.smartcampus.controller.booking;

import com.smartcampus.dto.booking.BookingDTO;
import com.smartcampus.dto.booking.BookingRequest;
import com.smartcampus.service.booking.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    public ResponseEntity<List<BookingDTO>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<List<BookingDTO>> getUserBookings() {
        return ResponseEntity.ok(bookingService.getUserBookings());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<BookingDTO>> getPendingBookings() {
        return ResponseEntity.ok(bookingService.getPendingBookings());
    }

    @GetMapping("/facility/{facilityId}")
    public ResponseEntity<List<BookingDTO>> getBookingsByFacility(@PathVariable Long facilityId) {
        return ResponseEntity.ok(bookingService.getBookingsByFacility(facilityId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingDTO> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    @PostMapping
    public ResponseEntity<BookingDTO> createBooking(@Valid @RequestBody BookingRequest request) {
        return ResponseEntity.ok(bookingService.createBooking(request));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<BookingDTO> approveBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.approveBooking(id));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<BookingDTO> rejectBooking(@PathVariable Long id, @RequestParam String reason) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, reason));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookingDTO> cancelBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.ok().build();
    }
}

