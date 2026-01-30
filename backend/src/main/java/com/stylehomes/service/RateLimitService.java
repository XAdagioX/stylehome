package com.stylehomes.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting service using Bucket4j.
 * Limits requests per IP to prevent spam and abuse.
 */
@Service
@Slf4j
public class RateLimitService {
    
    // Store buckets per IP address
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    
    // Store temporary bans (IP -> ban expiration time)
    private final Map<String, Long> bannedIps = new ConcurrentHashMap<>();
    
    // Rate limit: 5 requests per 10 minutes per IP
    private static final int REQUESTS_LIMIT = 5;
    private static final Duration REFILL_PERIOD = Duration.ofMinutes(10);
    
    // Temporary ban duration: 30 minutes
    private static final Duration BAN_DURATION = Duration.ofMinutes(30);
    
    // Threshold for automatic ban (consecutive violations)
    private final Map<String, Integer> violationCount = new ConcurrentHashMap<>();
    private static final int BAN_THRESHOLD = 3;
    
    /**
     * Check if request from IP is allowed.
     * @param ip Client IP address
     * @return true if allowed, false if rate limited
     */
    public boolean isAllowed(String ip) {
        // Check if IP is banned
        if (isBanned(ip)) {
            log.warn("RATE_LIMIT: Blocked banned IP: {}", ip);
            return false;
        }
        
        // Get or create bucket for this IP
        Bucket bucket = buckets.computeIfAbsent(ip, this::createBucket);
        
        // Try to consume one token
        if (bucket.tryConsume(1)) {
            // Request allowed, reset violation count
            violationCount.remove(ip);
            return true;
        } else {
            // Rate limited - increment violation count
            int violations = violationCount.merge(ip, 1, Integer::sum);
            log.warn("RATE_LIMIT: IP {} exceeded rate limit. Violations: {}", ip, violations);
            
            // Auto-ban after threshold
            if (violations >= BAN_THRESHOLD) {
                banIp(ip);
            }
            
            return false;
        }
    }
    
    /**
     * Check if IP is currently banned.
     */
    public boolean isBanned(String ip) {
        Long banExpiration = bannedIps.get(ip);
        if (banExpiration == null) {
            return false;
        }
        
        if (System.currentTimeMillis() > banExpiration) {
            // Ban expired, remove it
            bannedIps.remove(ip);
            violationCount.remove(ip);
            log.info("RATE_LIMIT: Ban expired for IP: {}", ip);
            return false;
        }
        
        return true;
    }
    
    /**
     * Temporarily ban an IP address.
     */
    public void banIp(String ip) {
        long banExpiration = System.currentTimeMillis() + BAN_DURATION.toMillis();
        bannedIps.put(ip, banExpiration);
        log.warn("RATE_LIMIT: Banned IP {} for {} minutes", ip, BAN_DURATION.toMinutes());
    }
    
    /**
     * Create a new rate limit bucket.
     */
    private Bucket createBucket(String ip) {
        Bandwidth limit = Bandwidth.classic(
            REQUESTS_LIMIT,
            Refill.greedy(REQUESTS_LIMIT, REFILL_PERIOD)
        );
        return Bucket.builder().addLimit(limit).build();
    }
    
    /**
     * Get remaining requests for an IP.
     */
    public long getRemainingRequests(String ip) {
        Bucket bucket = buckets.get(ip);
        if (bucket == null) {
            return REQUESTS_LIMIT;
        }
        return bucket.getAvailableTokens();
    }
    
    /**
     * Clean up expired entries (call periodically).
     */
    public void cleanup() {
        long now = System.currentTimeMillis();
        bannedIps.entrySet().removeIf(entry -> entry.getValue() < now);
        log.debug("RATE_LIMIT: Cleanup completed. Active buckets: {}, Banned IPs: {}", 
            buckets.size(), bannedIps.size());
    }
}
