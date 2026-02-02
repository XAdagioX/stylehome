package com.stylehomes.service;

import com.stylehomes.dto.ConsultationRequest;
import com.stylehomes.dto.PhotoData;
import com.stylehomes.exception.SpamException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Spam protection service.
 * Implements honeypot, timestamp validation, and spam scoring.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SpamProtectionService {
    
    // Spam score threshold - requests with score >= this are blocked
    private static final int SPAM_THRESHOLD = 15;
    
    // Time validation constants (in milliseconds)
    private static final long MIN_FORM_TIME_MS = 3_000;    // 3 seconds minimum
    private static final long MAX_FORM_TIME_MS = 3_600_000; // 1 hour maximum
    
    // Photo restrictions
    private static final int MAX_PHOTOS = 5;
    private static final long MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per photo
    private static final long MAX_TOTAL_PHOTOS_SIZE_BYTES = 50 * 1024 * 1024; // 50MB total
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
        "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
        "image/heic", "image/heif" // iPhone default format
    );
    private static final Set<String> FORBIDDEN_EXTENSIONS = Set.of(
        ".exe", ".bat", ".cmd", ".sh", ".php", ".js", ".html", ".htm",
        ".svg", ".zip", ".rar", ".7z", ".tar", ".gz", ".dll", ".so"
    );
    
    // Patterns for spam detection
    private static final Pattern URL_PATTERN = Pattern.compile(
        "(https?://|www\\.|\\[url|<a\\s+href)", Pattern.CASE_INSENSITIVE
    );
    private static final Pattern CYRILLIC_PATTERN = Pattern.compile("[а-яА-ЯёЁіІїЇєЄґҐ]");
    private static final Pattern LATIN_PATTERN = Pattern.compile("[a-zA-Z]");
    
    // Track recent submissions for duplicate detection (simplified in-memory)
    private final Set<String> recentSubmissionHashes = new HashSet<>();
    
    /**
     * Validate request and check for spam.
     * @param request The consultation request
     * @param clientIp Client IP address
     * @throws SpamException if spam detected
     */
    public void validateRequest(ConsultationRequest request, String clientIp) {
        StringBuilder reasons = new StringBuilder();
        int spamScore = 0;
        
        // 1. Honeypot check - if filled, it's a bot
        if (request.getCompanyName() != null && !request.getCompanyName().isBlank()) {
            log.warn("SPAM: Honeypot triggered from IP: {}. Value: {}", clientIp, request.getCompanyName());
            throw new SpamException("Request rejected");
        }
        
        // 2. Timestamp validation
        Long formRenderedAt = request.getFormRenderedAt();
        if (formRenderedAt != null) {
            long now = System.currentTimeMillis();
            long formTime = now - formRenderedAt;
            
            if (formTime < MIN_FORM_TIME_MS) {
                log.warn("SPAM: Form submitted too fast from IP: {}. Time: {}ms", clientIp, formTime);
                spamScore += 20;
                reasons.append("Too fast submission; ");
            }
            
            if (formTime > MAX_FORM_TIME_MS) {
                log.warn("SPAM: Form too old from IP: {}. Time: {}ms", clientIp, formTime);
                spamScore += 10;
                reasons.append("Stale form; ");
            }
        } else {
            // No timestamp - suspicious but not blocking
            spamScore += 5;
            reasons.append("No timestamp; ");
        }
        
        // 3. Content spam scoring
        String details = request.getProjectDetails();
        if (details != null) {
            // Check for URLs
            if (URL_PATTERN.matcher(details).find()) {
                spamScore += 10;
                reasons.append("Contains URL; ");
                log.info("SPAM_SCORE: +10 (URL) from IP: {}", clientIp);
            }
            
            // Check for mixed scripts (Cyrillic + Latin)
            boolean hasCyrillic = CYRILLIC_PATTERN.matcher(details).find();
            boolean hasLatin = LATIN_PATTERN.matcher(details).find();
            if (hasCyrillic && hasLatin && details.length() > 50) {
                spamScore += 3;
                reasons.append("Mixed scripts; ");
                log.info("SPAM_SCORE: +3 (mixed scripts) from IP: {}", clientIp);
            }
            
            // Check for very long text (potential abuse)
            if (details.length() > 5000) {
                spamScore += 5;
                reasons.append("Very long text; ");
            }
            
            // Check for duplicate content (simplified hash check)
            String contentHash = hashContent(request);
            if (recentSubmissionHashes.contains(contentHash)) {
                spamScore += 15;
                reasons.append("Duplicate submission; ");
                log.warn("SPAM: Duplicate submission from IP: {}", clientIp);
            } else {
                // Add to recent submissions (keep limited size)
                if (recentSubmissionHashes.size() > 1000) {
                    recentSubmissionHashes.clear();
                }
                recentSubmissionHashes.add(contentHash);
            }
        }
        
        // 4. Email validation
        String email = request.getEmail();
        if (email != null) {
            // Suspicious email patterns
            if (email.contains("+") || email.matches(".*\\d{5,}.*")) {
                spamScore += 3;
                reasons.append("Suspicious email; ");
            }
        }
        
        // 5. Validate photos
        validatePhotos(request.getPhotos(), clientIp);
        
        // Final spam check
        log.info("SPAM_SCORE: {} for IP: {}. Reasons: {}", spamScore, clientIp, 
            reasons.length() > 0 ? reasons.toString() : "none");
        
        if (spamScore >= SPAM_THRESHOLD) {
            log.warn("SPAM: Blocked request from IP: {}. Score: {}. Reasons: {}", 
                clientIp, spamScore, reasons);
            throw new SpamException("Request rejected due to suspicious activity");
        }
    }
    
    /**
     * Validate photo attachments.
     */
    private void validatePhotos(List<PhotoData> photos, String clientIp) {
        if (photos == null || photos.isEmpty()) {
            return;
        }
        
        // Check photo count
        if (photos.size() > MAX_PHOTOS) {
            log.warn("SPAM: Too many photos ({}) from IP: {}", photos.size(), clientIp);
            throw new SpamException("Too many photos. Maximum allowed: " + MAX_PHOTOS);
        }
        
        long totalSize = 0;
        
        for (PhotoData photo : photos) {
            // Check MIME type
            String contentType = photo.getContentType();
            if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
                log.warn("SPAM: Invalid photo type '{}' from IP: {}", contentType, clientIp);
                throw new SpamException("Invalid file type: " + contentType);
            }
            
            // Check filename for forbidden extensions
            String filename = photo.getFilename();
            if (filename != null) {
                String lowerFilename = filename.toLowerCase();
                for (String forbidden : FORBIDDEN_EXTENSIONS) {
                    if (lowerFilename.endsWith(forbidden)) {
                        log.warn("SPAM: Forbidden file extension '{}' from IP: {}", filename, clientIp);
                        throw new SpamException("File type not allowed: " + forbidden);
                    }
                }
            }
            
            // Check individual file size
            Long size = photo.getSize();
            if (size != null && size > MAX_PHOTO_SIZE_BYTES) {
                log.warn("SPAM: Photo too large ({} bytes) from IP: {}", size, clientIp);
                throw new SpamException("Photo too large. Maximum size: 10MB");
            }
            
            // Estimate size from base64 if not provided
            if (size == null && photo.getData() != null) {
                // Base64 is ~4/3 of original size
                size = (long) (photo.getData().length() * 0.75);
            }
            
            if (size != null) {
                totalSize += size;
            }
        }
        
        // Check total size
        if (totalSize > MAX_TOTAL_PHOTOS_SIZE_BYTES) {
            log.warn("SPAM: Total photos too large ({} bytes) from IP: {}", totalSize, clientIp);
            throw new SpamException("Total photos size too large. Maximum: 50MB");
        }
        
        log.info("PHOTOS: Validated {} photos, total size: {} bytes from IP: {}", 
            photos.size(), totalSize, clientIp);
    }
    
    /**
     * Create a hash of request content for duplicate detection.
     */
    private String hashContent(ConsultationRequest request) {
        return String.valueOf(
            (request.getEmail() + "|" + 
             request.getProjectDetails() + "|" + 
             request.getFirstName()).hashCode()
        );
    }
}
