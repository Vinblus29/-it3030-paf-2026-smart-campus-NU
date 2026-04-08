package com.smartcampus.service.ticket;

import com.smartcampus.dto.ticket.TicketRequest;
import com.smartcampus.dto.ticket.TicketResponse;
import com.smartcampus.entity.Ticket;
import com.smartcampus.enums.TicketCategory;
import com.smartcampus.enums.Priority;
import com.smartcampus.repository.TicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository repository;

    @InjectMocks
    private TicketService service;

    private TicketRequest sampleRequest;
    private Ticket sampleTicket;

    @BeforeEach
    void setUp() {
        sampleRequest = new TicketRequest();
        sampleRequest.setTitle("Test Ticket");
        sampleRequest.setDescription("Test Description");
        sampleRequest.setLocation("Test Location");
        sampleRequest.setReportedBy("Test User");
        sampleRequest.setPriority(Priority.HIGH);
        sampleRequest.setCategory(TicketCategory.ELECTRICAL);
        sampleRequest.setImageAttachments(Arrays.asList("image1.jpg", "image2.jpg"));

        sampleTicket = new Ticket();
        sampleTicket.setId(1L);
        sampleTicket.setTitle("Test Ticket");
        sampleTicket.setDescription("Test Description");
        sampleTicket.setLocation("Test Location");
        sampleTicket.setReportedBy("Test User");
        sampleTicket.setPriority(Priority.HIGH);
        sampleTicket.setCategory(TicketCategory.ELECTRICAL);
        sampleTicket.setImageAttachments(Arrays.asList("image1.jpg", "image2.jpg"));
    }

    @Test
    void createTicket_ShouldReturnTicketResponse_WhenValidRequest() {
        // Given
        when(repository.save(any(Ticket.class))).thenReturn(sampleTicket);

        // When
        TicketResponse response = service.createTicket(sampleRequest);

        // Then
        assertNotNull(response);
        assertEquals("Test Ticket", response.getTitle());
        assertEquals(TicketCategory.ELECTRICAL, response.getCategory());
        assertEquals(2, response.getImageAttachments().size());
        verify(repository, times(1)).save(any(Ticket.class));
    }

    @Test
    void getTicketsByCategory_ShouldReturnFilteredTickets_WhenCategoryProvided() {
        // Given
        List<Ticket> tickets = Arrays.asList(sampleTicket);
        when(repository.findByCategory(TicketCategory.ELECTRICAL)).thenReturn(tickets);

        // When
        List<TicketResponse> responses = service.getTicketsByCategory(TicketCategory.ELECTRICAL);

        // Then
        assertEquals(1, responses.size());
        assertEquals(TicketCategory.ELECTRICAL, responses.get(0).getCategory());
        verify(repository, times(1)).findByCategory(TicketCategory.ELECTRICAL);
    }

    @Test
    void addImageAttachment_ShouldAddImageToTicket_WhenTicketExists() {
        // Given
        MultipartFile mockImage = mock(MultipartFile.class);
        when(mockImage.getOriginalFilename()).thenReturn("new-image.jpg");
        when(repository.findById(1L)).thenReturn(Optional.of(sampleTicket));
        when(repository.save(any(Ticket.class))).thenReturn(sampleTicket);

        // When
        TicketResponse response = service.addImageAttachment(1L, mockImage);

        // Then
        assertNotNull(response);
        assertTrue(response.getImageAttachments().contains("/uploads/tickets/1/new-image.jpg"));
        verify(repository, times(1)).findById(1L);
        verify(repository, times(1)).save(any(Ticket.class));
    }
}
