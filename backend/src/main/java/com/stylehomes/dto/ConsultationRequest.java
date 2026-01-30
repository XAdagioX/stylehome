package com.stylehomes.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.util.List;

@Data
public class ConsultationRequest {
    @NotBlank(message = "First name is required")
    private String firstName;
    
    private String lastName;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
    
    @Pattern(regexp = "^[\\d\\s\\-\\(\\)\\+]*$", message = "Invalid phone number format")
    private String phone;
    
    private String projectType;
    
    private String projectLocation;
    
    private String estimatedBudget;
    
    private String preferredTimeline;
    
    @NotBlank(message = "Project details are required")
    private String projectDetails;
    
    /**
     * List of photos attached to the consultation request.
     * Photos are sent as base64 encoded data from the frontend.
     */
    private List<PhotoData> photos;
    
    // ===== ANTI-SPAM FIELDS =====
    
    /**
     * Honeypot field - should be empty.
     * Bots typically fill all fields, humans don't see this field (hidden via CSS).
     */
    private String companyName;
    
    /**
     * Timestamp when the form was rendered.
     * Used to detect bots (too fast submission) and stale forms.
     */
    private Long formRenderedAt;
}
