# Style Homes Backend API

Spring Boot backend for the Style Homes website.

## Technologies

- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
- H2 Database (development) / PostgreSQL (production)
- Flyway (database migrations)
- Spring Mail
- Lombok

## Project Structure

```
backend/
├── src/main/java/com/stylehomes/
│   ├── StyleHomesApplication.java
│   ├── config/          # Configuration (CORS, Async, Mail)
│   ├── controller/      # REST controllers
│   ├── service/         # Business logic
│   ├── repository/      # JPA repositories
│   ├── model/           # Entity models
│   ├── dto/             # Data Transfer Objects
│   └── exception/       # Error handling
└── src/main/resources/
    ├── application.yml
    └── db/migration/    # SQL migrations
```

## Running the Project

### Requirements
- Java 17+
- Maven 3.6+ (or use Maven Wrapper)

### Local Run (with Maven)

```bash
# Build the project
mvn clean install

# Run
mvn spring-boot:run
```

### Without Maven (using Java)

If Maven is not installed, you can use Maven Wrapper or download dependencies manually.

## API Endpoints

### Consultation API

- `POST /api/consultations` - Create a new request
- `GET /api/consultations` - Get all requests
- `GET /api/consultations/{id}` - Get a specific request
- `PUT /api/consultations/{id}/status?status=PROCESSED` - Update status
- `DELETE /api/consultations/{id}` - Delete a request

### Example Request

```bash
POST http://localhost:8080/api/consultations
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1 (503) 980 5216",
  "projectType": "kitchen",
  "projectLocation": "Portland, OR",
  "estimatedBudget": "10k-25k",
  "preferredTimeline": "1-2-months",
  "projectDetails": "I need a kitchen renovation"
}
```

## Configuration

### Development (application-dev.yml)
- H2 in-memory database
- Automatic table creation
- Detailed logging

### Production (application-prod.yml)
- PostgreSQL database
- Flyway migrations
- Minimal logging

### Email Configuration

Add environment variables:
- `MAIL_USERNAME` - SMTP username
- `MAIL_PASSWORD` - SMTP password
- `MAIL_FROM` - Sender email
- `ADMIN_EMAIL` - Administrator email

## Database

### H2 Console (development)
Available at: http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:mem:stylehomesdb`
- Username: `sa`
- Password: (empty)

### Migrations
Migrations are located in `src/main/resources/db/migration/` and run automatically on startup.

## ✅ Photo Attachments

The backend fully supports photo attachments:

- Frontend converts photos to base64 and sends them in JSON payload
- Backend decodes base64 and attaches photos to the admin notification email
- Admin receives email with all photos attached (not just links!)

See `EMAIL_SETUP.md` for detailed email configuration.

## Deployment on Render.com

1. Create a new Web Service on Render.com
2. Connect your GitHub repository
3. Set build command: `mvn clean install`
4. Set start command: `java -jar target/stylehome-backend-1.0.0.jar --spring.profiles.active=prod`
5. Add environment variables (see `EMAIL_SETUP.md`)
6. Add PostgreSQL database

## Next Steps

1. Add Projects API
2. Add Testimonials API
3. Configure Spring Security for admin panel
4. Add file upload for project images
5. Configure CI/CD
