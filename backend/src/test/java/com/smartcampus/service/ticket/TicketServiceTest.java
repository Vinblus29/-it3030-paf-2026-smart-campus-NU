package com.smartcampus.service.ticket;

import com.smartcampus.dto.ticket.TicketRequest;
import com.smartcampus.dto.ticket.TicketResponse;
import com.smartcampus.entity.Ticket;
import com.smartcampus.entity.TicketActivity;
import com.smartcampus.enums.TicketStatus;
import com.smartcampus.enums.Priority;
import com.smartcampus.enums.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.repository.TicketActivityRepository;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.S3Service;
import com.smartcampus.service.auth.AuthService;
import com.smartcampus.service.notification.PushNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository repository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private TicketActivityRepository activityRepository;

    @Mock
    private S3Service s3Service;

    @Mock
    private PushNotificationService pushNotificationService;

    @Mock
    private AuthService authService;

    @InjectMocks
    private TicketService service;

    private TicketRequest sampleRequest;
    private Ticket sampleTicket;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setEmail("test@user.com");
        testUser.setRole(Role.USER);
        testUser.setEnabled(true);

        sampleRequest = new TicketRequest();
        sampleRequest.setTitle("Test Ticket");
        sampleRequest.setDescription("Test Description");
        sampleRequest.setLocation("Test Location");
        sampleRequest.setPriority(Priority.HIGH);
        sampleRequest.setCategory("ELECTRICAL");

        sampleTicket = new Ticket();
        sampleTicket.setId(1L);
        sampleTicket.setTitle("Test Ticket");
        sampleTicket.setDescription("Test Description");
        sampleTicket.setLocation("Test Location");
        sampleTicket.setCategory("ELECTRICAL");
        sampleTicket.setPriority(Priority.HIGH);
        sampleTicket.setStatus(TicketStatus.OPEN);
        sampleTicket.setReporter(testUser);
        sampleTicket.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void createTicket_ShouldReturnTicketResponse_WhenValidRequest() {
        // Given
        when(authService.getCurrentUser()).thenReturn(testUser);
        when(repository.existsOpenTicketByReporterAndTitleAndLocation(anyLong(), anyString(), anyString())).thenReturn(false);
        when(repository.save(any(Ticket.class))).thenReturn(sampleTicket);
        when(activityRepository.save(any(TicketActivity.class))).thenReturn(null);

        // When
        TicketResponse response = service.createTicket(sampleRequest, new ArrayList<>());

        // Then
        assertNotNull(response);
        assertEquals("Test Ticket", response.getTitle());
        assertEquals("ELECTRICAL", response.getCategory());
        verify(repository, times(1)).save(any(Ticket.class));
    }

    @Test
    void searchTickets_ShouldReturnFilteredTickets_WhenQueryProvided() {
        // Given
        when(authService.getCurrentUser()).thenReturn(testUser);
        List<Ticket> tickets = Arrays.asList(sampleTicket);
        when(repository.searchMyTickets(eq(1L), any(), any(), any(), any())).thenReturn(tickets);

        // When
        List<TicketResponse> responses = service.searchTickets("Test", null, null, null);

        // Then
        assertEquals(1, responses.size());
        assertEquals("ELECTRICAL", responses.get(0).getCategory());
        verify(repository, times(1)).searchMyTickets(eq(1L), any(), any(), any(), any());
    }

    @Test
    void getTicketById_ShouldReturnTicket_WhenAuthorized() {
        // Given
        when(authService.getCurrentUser()).thenReturn(testUser);
        when(repository.findById(1L)).thenReturn(java.util.Optional.of(sampleTicket));

        // When
        TicketResponse response = service.getTicketById(1L);

        // Then
        assertNotNull(response);
        assertEquals(1L, response.getId());
        verify(repository, times(1)).findById(1L);
    }
}
