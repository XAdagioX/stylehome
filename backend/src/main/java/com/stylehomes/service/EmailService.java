package com.stylehomes.service;

import com.stylehomes.dto.ConsultationRequest;
import com.stylehomes.dto.PhotoData;
import com.stylehomes.model.Consultation;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private final JavaMailSender mailSender;
    
    @Value("${app.email.from}")
    private String fromEmail;
    
    @Value("${app.email.admin}")
    private String adminEmail;
    
    /**
     * Send confirmation email to the customer (text only, no attachments)
     */
    @Async
    public void sendConsultationConfirmation(Consultation consultation) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(consultation.getEmail());
            message.setSubject("Thank you for your consultation request - Style Homes");
            message.setText(buildConfirmationEmail(consultation));
            
            mailSender.send(message);
            log.info("Confirmation email sent to: {}", consultation.getEmail());
        } catch (Exception e) {
            log.error("Failed to send confirmation email to: {}", consultation.getEmail(), e);
        }
    }
    
    /**
     * Send admin notification email WITH photo attachments
     */
    @Async
    public void sendAdminNotificationWithPhotos(Consultation consultation, List<PhotoData> photos) {
        try {
            if (photos == null || photos.isEmpty()) {
                // No photos - send simple text email
                sendSimpleAdminNotification(consultation);
                return;
            }
            
            // Create MimeMessage for attachments
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(adminEmail);
            helper.setSubject("New Consultation Request (with photos) - Style Homes");
            helper.setText(buildAdminNotificationEmail(consultation, photos.size()), true);
            
            // Add photo attachments
            int photoIndex = 1;
            for (PhotoData photo : photos) {
                try {
                    byte[] photoBytes = Base64.getDecoder().decode(photo.getData());
                    String filename = photo.getFilename() != null ? photo.getFilename() : "photo_" + photoIndex + ".jpg";
                    String contentType = photo.getContentType() != null ? photo.getContentType() : "image/jpeg";
                    
                    helper.addAttachment(filename, new ByteArrayResource(photoBytes), contentType);
                    log.debug("Added attachment: {} ({} bytes)", filename, photoBytes.length);
                    photoIndex++;
                } catch (Exception e) {
                    log.error("Failed to add photo attachment: {}", photo.getFilename(), e);
                }
            }
            
            mailSender.send(mimeMessage);
            log.info("Admin notification email with {} photos sent for consultation ID: {}", photos.size(), consultation.getId());
            
        } catch (MessagingException e) {
            log.error("Failed to send admin notification email with attachments", e);
            // Fallback to simple email without attachments
            sendSimpleAdminNotification(consultation);
        }
    }
    
    /**
     * Send simple admin notification email (text only, no attachments)
     */
    @Async
    public void sendAdminNotification(Consultation consultation) {
        sendSimpleAdminNotification(consultation);
    }
    
    private void sendSimpleAdminNotification(Consultation consultation) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(adminEmail);
            helper.setSubject("New Consultation Request - Style Homes");
            helper.setText(buildAdminNotificationEmail(consultation, 0), true);
            
            mailSender.send(mimeMessage);
            log.info("Admin notification email sent for consultation ID: {}", consultation.getId());
        } catch (Exception e) {
            log.error("Failed to send admin notification email", e);
        }
    }
    
    private String buildConfirmationEmail(Consultation consultation) {
        return String.format(
            """
            Dear %s %s,
            
            Thank you for contacting Style Homes! We have received your consultation request and will contact you shortly.
            
            Your request details:
            - Project Type: %s
            - Location: %s
            - Estimated Budget: %s
            - Preferred Timeline: %s
            
            We will review your request and get back to you within 24-48 hours.
            
            Best regards,
            Style Homes Team
            
            --
            Style Homes - Smart Investment • Quality Craftsmanship
            Website: https://stylehomesusa.com
            """,
            consultation.getFirstName(),
            consultation.getLastName() != null ? consultation.getLastName() : "",
            consultation.getProjectType() != null ? consultation.getProjectType() : "Not specified",
            consultation.getProjectLocation() != null ? consultation.getProjectLocation() : "Not specified",
            consultation.getEstimatedBudget() != null ? consultation.getEstimatedBudget() : "Not specified",
            consultation.getPreferredTimeline() != null ? consultation.getPreferredTimeline() : "Not specified"
        );
    }
    
    private String buildAdminNotificationEmail(Consultation consultation, int photoCount) {
        String firstName = HtmlUtils.htmlEscape(consultation.getFirstName());
        String lastName = HtmlUtils.htmlEscape(consultation.getLastName() != null ? consultation.getLastName() : "");
        String email = HtmlUtils.htmlEscape(consultation.getEmail());
        String phone = HtmlUtils.htmlEscape(consultation.getPhone() != null ? consultation.getPhone() : "Not provided");
        String projectType = HtmlUtils.htmlEscape(consultation.getProjectType() != null ? consultation.getProjectType() : "Not specified");
        String projectLocation = HtmlUtils.htmlEscape(consultation.getProjectLocation() != null ? consultation.getProjectLocation() : "Not specified");
        String estimatedBudget = HtmlUtils.htmlEscape(consultation.getEstimatedBudget() != null ? consultation.getEstimatedBudget() : "Not specified");
        String preferredTimeline = HtmlUtils.htmlEscape(consultation.getPreferredTimeline() != null ? consultation.getPreferredTimeline() : "Not specified");
        String projectDetails = HtmlUtils.htmlEscape(consultation.getProjectDetails());

        String photosBlock = photoCount > 0
            ? "<p style='color: #27ae60;'><strong>📷 Attached photos:</strong> " + photoCount + "</p>"
            : "";

        return String.format("""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px;">
                <div style="max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                        New Consultation Request
                    </h2>
                    
                    <table style="width: 100%%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Customer:</strong></td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">%s %s</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><a href="mailto:%s">%s</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><a href="tel:%s">%s</a></td>
                        </tr>
                    </table>

                    <h3 style="color: #2c3e50; margin-top: 20px;">Project Details</h3>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
                        <p style="margin: 5px 0;"><strong>Type:</strong> %s</p>
                        <p style="margin: 5px 0;"><strong>Location:</strong> %s</p>
                        <p style="margin: 5px 0;"><strong>Budget:</strong> %s</p>
                        <p style="margin: 5px 0;"><strong>Timeline:</strong> %s</p>
                    </div>

                    <h3 style="color: #2c3e50; margin-top: 20px;">Message</h3>
                    <p style="white-space: pre-wrap; background-color: #fff; border: 1px solid #eee; padding: 10px;">%s</p>

                    %s

                    <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
                        Request ID: #%d | Received: %s
                    </div>
                </div>
            </body>
            </html>
            """,
            firstName, lastName,
            consultation.getEmail(), email,
            consultation.getPhone() != null ? consultation.getPhone() : "", phone,
            projectType, projectLocation, estimatedBudget, preferredTimeline,
            projectDetails,
            photosBlock,
            consultation.getId(),
            consultation.getCreatedAt()
        );
    }
}
