# Smart Campus

A comprehensive campus management system built with Spring Boot (Backend) and React + Ant Design (Frontend).

## Features

- **User Management**: Admin approval system for new user registrations
- **Facility Booking**: Book campus facilities with approval workflow
- **Ticket Management**: Create and track support tickets
- **Notifications**: Real-time notifications for users
- **Role-based Dashboards**: Admin, Technician, and User dashboards
- **Analytics**: Visual statistics and charts on dashboards

## Tech Stack

### Backend
- Java 17+
- Spring Boot 3.x
- Spring Security with JWT
- PostgreSQL
- AWS S3 for file storage

### Frontend
- React 19
- Ant Design 6.x
- React Router
- Axios
- @ant-design/charts

## Getting Started

### Prerequisites
- Java 17 or higher
- Node.js 18 or higher
- PostgreSQL database
- AWS account (for S3)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Update `src/main/resources/application.properties` with your database credentials:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/smart_uni
spring.datasource.username=your_username
spring.datasource.password=your_password
```

3. Run the backend:
```bash
./mvnw spring-boot:run
```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smartuni.com | admin123 |
| Technician | technician@smartuni.com | tech123 |
| User | user@smartuni.com | user123 |

## User Registration Flow

1. **Register**: New users register through the registration page
2. **Pending Approval**: Users are created as disabled by default
3. **Admin Approval**: Admin reviews and approves new users in the Users page
4. **Login**: Approved users can now login and access the system

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/otp/generate` - Generate OTP
- `POST /api/auth/otp/verify` - Verify OTP

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/pending` - Get pending users
- `PUT /api/admin/users/{id}/approve` - Approve user
- `DELETE /api/admin/users/{id}/reject` - Reject user
- `PUT /api/admin/users/{id}/enable` - Enable user
- `PUT /api/admin/users/{id}/disable` - Disable user
- `GET /api/admin/stats` - Get analytics stats

### Facilities
- `GET /api/facilities` - Get all facilities
- `POST /api/facilities` - Create facility (Admin)
- `PUT /api/facilities/{id}` - Update facility
- `DELETE /api/facilities/{id}` - Delete facility

### Bookings
- `GET /api/bookings` - Get all bookings (Admin)
- `GET /api/bookings/my` - Get user's bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/{id}/approve` - Approve booking
- `PUT /api/bookings/{id}/reject` - Reject booking
- `DELETE /api/bookings/{id}` - Cancel booking

### Tickets
- `GET /api/tickets` - Get all tickets (Admin/Technician)
- `GET /api/tickets/my` - Get user's tickets
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/{id}` - Update ticket
- `DELETE /api/tickets/{id}` - Delete ticket

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/{id}/read` - Mark as read
- `DELETE /api/notifications/{id}` - Delete notification

## Project Structure

```
smart-uni/
├── backend/
│   └── src/main/java/com/smartcampus/
│       ├── config/          # Configuration classes
│       ├── controller/       # REST controllers
│       ├── dto/             # Data transfer objects
│       ├── entity/          # JPA entities
│       ├── enums/           # Enum classes
│       ├── exception/       # Exception handlers
│       ├── model/           # Domain models
│       ├── repository/      # Data repositories
│       ├── security/        # Security config
│       └── service/         # Business logic
├── frontend/
│   └── src/
│       ├── components/      # Reusable components
│       ├── context/         # React contexts
│       ├── layouts/         # Page layouts
│       ├── pages/           # Page components
│       ├── services/        # API services
│       └── App.jsx          # Main app component
├── README.md
└── PR_DESCRIPTION.md
```

## License

This project is for educational purposes.

