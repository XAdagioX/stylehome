package com.stylehomes.controller;

import com.stylehomes.dto.ConsultationRequest;
import com.stylehomes.dto.ConsultationResponse;
import com.stylehomes.exception.SpamException;
import com.stylehomes.service.ConsultationService;
import com.stylehomes.service.RateLimitService;
import com.stylehomes.service.SpamProtectionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consultations")
@RequiredArgsConstructor
@Slf4j
public class ConsultationController {
    private final ConsultationService consultationService;
    private final RateLimitService rateLimitService;
    private final SpamProtectionService spamProtectionService;
    
    @PostMapping
    public ResponseEntity<ConsultationResponse> createConsultation(
            @Valid @RequestBody ConsultationRequest request,
            HttpServletRequest httpRequest) {
        
        // Get client IP
        String clientIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        // Log incoming request
        log.info("CONSULTATION_REQUEST: IP={}, UA={}, Email={}", 
            clientIp, userAgent, request.getEmail());
        
        // 1. Rate limiting check
        if (!rateLimitService.isAllowed(clientIp)) {
            log.warn("RATE_LIMITED: IP={}, Email={}", clientIp, request.getEmail());
            throw new SpamException("Too many requests. Please try again later.");
        }
        
        // 2. Spam protection checks (honeypot, timestamp, scoring)
        spamProtectionService.validateRequest(request, clientIp);
        
        // 3. Create consultation (saves to DB, sends emails async)
        ConsultationResponse response = consultationService.createConsultation(request);
        
        log.info("CONSULTATION_CREATED: ID={}, IP={}, Email={}", 
            response.getId(), clientIp, request.getEmail());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Get client IP address, handling proxies.
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // Take first IP (original client)
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
    
    @GetMapping
    public ResponseEntity<List<ConsultationResponse>> getAllConsultations() {
        List<ConsultationResponse> consultations = consultationService.getAllConsultations();
        return ResponseEntity.ok(consultations);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ConsultationResponse> getConsultationById(@PathVariable Long id) {
        ConsultationResponse consultation = consultationService.getConsultationById(id);
        return ResponseEntity.ok(consultation);
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<ConsultationResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        ConsultationResponse updated = consultationService.updateConsultationStatus(id, status);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConsultation(@PathVariable Long id) {
        consultationService.deleteConsultation(id);
        return ResponseEntity.noContent().build();
    }
}
