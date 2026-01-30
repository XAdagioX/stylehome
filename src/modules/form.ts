// Form module - auto-resize textarea, form validation, and photo upload

import { querySelector, querySelectorAll } from '../utils/dom';

// Store uploaded photos
let uploadedPhotos: File[] = [];

// Store timestamp when form was rendered (for anti-spam)
let formRenderedAt: number = Date.now();

/**
 * Initialize automatic textarea resize
 */
function initTextareaResize(): void {
  const textarea = querySelector<HTMLTextAreaElement>('.form__textarea');
  if (!textarea) return;
  
  // Set initial height
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
  
  // Automatically change height on text input
  textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    const newHeight = Math.min(this.scrollHeight, 400); // Maximum height 400px
    this.style.height = `${newHeight}px`;
  });
  
  // Also on page load
  window.addEventListener('load', () => {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 400);
    textarea.style.height = `${newHeight}px`;
  });
}

/**
 * Validate form field
 */
function validateField(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean {
  const isValid = field.checkValidity();
  
  if (!isValid) {
    field.classList.add('error');
  } else {
    field.classList.remove('error');
  }
  
  return isValid;
}

/**
 * Validate entire form
 */
function validateForm(form: HTMLFormElement): boolean {
  const requiredFields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    'input[required], select[required], textarea[required]'
  );
  
  let isFormValid = true;
  
  requiredFields.forEach(field => {
    const isValid = validateField(field);
    if (!isValid) {
      isFormValid = false;
    }
  });
  
  return isFormValid;
}

/**
 * Add required class to labels and make asterisks red
 */
function markRequiredLabels(): void {
  const form = querySelector<HTMLFormElement>('.consultation__form');
  if (!form) return;
  
  const requiredFields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    'input[required], select[required], textarea[required]'
  );
  
  requiredFields.forEach(field => {
    const label = form.querySelector<HTMLLabelElement>(`label[for="${field.id}"]`);
    if (label) {
      // Replace asterisk in label text with red styled span
      const labelText = label.innerHTML;
      // Check if asterisk exists and not already wrapped in span
      if (labelText.includes('*') && !labelText.includes('<span')) {
        label.innerHTML = labelText.replace(/\s*\*\s*$/, ' <span style="color: #8b0000; font-weight: 700;">*</span>');
      }
      label.classList.add('required');
    }
  });
}

/**
 * Initialize photo upload functionality
 */
function initPhotoUpload(): void {
  const fileInput = querySelector<HTMLInputElement>('#photos');
  const previewContainer = querySelector<HTMLElement>('#photosPreview');
  
  if (!fileInput || !previewContainer) return;
  
  // Handle file selection
  fileInput.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (!target.files) return;
    
    const files = Array.from(target.files);
    
    // Validate file types and sizes
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    
    files.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} is not supported. Please select an image (JPG, PNG, WEBP, GIF).`);
        return;
      }
      
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size: 10MB.`);
        return;
      }
      
      // Add to uploaded photos array
      uploadedPhotos.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'form__photo-item';
        photoItem.dataset.fileName = file.name;
        
        const img = document.createElement('img');
        img.src = e.target?.result as string;
        img.alt = file.name;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'form__photo-remove';
        removeBtn.type = 'button';
        removeBtn.setAttribute('aria-label', 'Remove photo');
        removeBtn.addEventListener('click', () => {
          // Remove from array
          uploadedPhotos = uploadedPhotos.filter(f => f !== file);
          // Remove from DOM
          photoItem.remove();
          // Update file input
          updateFileInput();
        });
        
        photoItem.appendChild(img);
        photoItem.appendChild(removeBtn);
        previewContainer.appendChild(photoItem);
      };
      
      reader.readAsDataURL(file);
    });
    
    // Clear file input to allow selecting the same file again
    fileInput.value = '';
  });
}

/**
 * Update file input to reflect current uploaded photos
 */
function updateFileInput(): void {
  const fileInput = querySelector<HTMLInputElement>('#photos');
  if (!fileInput) return;
  
  // Create a new DataTransfer object to simulate file selection
  const dataTransfer = new DataTransfer();
  uploadedPhotos.forEach(file => {
    dataTransfer.items.add(file);
  });
  
  fileInput.files = dataTransfer.files;
}

/**
 * Initialize form validation
 */
function initFormValidation(): void {
  const form = querySelector<HTMLFormElement>('.consultation__form');
  if (!form) return;
  
  // Mark required labels
  markRequiredLabels();
  
  // Remove error class on input/change
  const fields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    'input, select, textarea'
  );
  
  fields.forEach(field => {
    field.addEventListener('input', () => {
      if (field.hasAttribute('required')) {
        validateField(field);
      }
    });
    
    field.addEventListener('change', () => {
      if (field.hasAttribute('required')) {
        validateField(field);
      }
    });
  });
  
  // Validate on form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const isValid = validateForm(form);
    
    if (isValid) {
      // Show loading state
      const submitBtn = form.querySelector<HTMLButtonElement>('.form__submit');
      const originalText = submitBtn?.textContent || 'Send';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }
      
      try {
        // Prepare form data
        const formData = new FormData(form);
        
        // Add photos to form data
        uploadedPhotos.forEach((file, index) => {
          formData.append(`photo_${index}`, file);
        });
        formData.append('photoCount', uploadedPhotos.length.toString());
        
        // Send form data (you can use EmailJS, Formspree, or your backend)
        await submitForm(formData);
        
        // Show success message
        showFormMessage('Thank you! Your message has been sent. We will contact you soon.', 'success');
        
        // Reset form
        form.reset();
        uploadedPhotos = [];
        const previewContainer = querySelector<HTMLElement>('#photosPreview');
        if (previewContainer) {
          previewContainer.innerHTML = '';
        }
        
      } catch (error) {
        console.error('Form submission error:', error);
        showFormMessage('Form submission error. Please try again or contact us directly.', 'error');
      } finally {
        // Restore button state
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    } else {
      // Scroll to first error field
      const firstError = form.querySelector<HTMLElement>('.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
    }
  });
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Submit form data to backend API
 */
async function submitForm(formData: FormData): Promise<void> {
  // Get backend URL from environment or use default
  // In production with Nginx proxy, leave BACKEND_URL empty or undefined
  // For local development, set window.BACKEND_URL = 'http://localhost:8080'
  const backendUrl = (window as any).BACKEND_URL ?? '';
  const apiEndpoint = `${backendUrl}/api/consultations`;
  
  // Prepare JSON payload matching ConsultationRequest DTO
  const payload: any = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string || '',
    email: formData.get('email') as string,
    phone: formData.get('phone') as string || '',
    projectType: formData.get('projectType') as string || '',
    projectLocation: formData.get('location') as string || '',
    estimatedBudget: formData.get('budget') as string || '',
    preferredTimeline: formData.get('timeline') as string || '',
    projectDetails: formData.get('details') as string,
    // Anti-spam fields
    companyName: formData.get('companyName') as string || '', // Honeypot - should be empty
    formRenderedAt: formRenderedAt, // Timestamp when form was loaded
  };
  
  // Convert photos to base64 and add to payload
  // Note: Backend needs to support 'photos' field in ConsultationRequest
  // If backend doesn't support photos yet, they will be ignored
  if (uploadedPhotos.length > 0) {
    payload.photos = [];
    for (const photo of uploadedPhotos) {
      try {
        const base64 = await fileToBase64(photo);
        payload.photos.push({
          filename: photo.name,
          contentType: photo.type,
          data: base64,
          size: photo.size
        });
      } catch (error) {
        console.error(`Failed to convert photo ${photo.name} to base64:`, error);
      }
    }
  }
  
  // Send to backend
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Form submission failed';
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
  
  const result = await response.json();
  console.log('Form submitted successfully:', result);
}

/**
 * Show form message (success or error)
 */
function showFormMessage(message: string, type: 'success' | 'error'): void {
  const form = querySelector<HTMLFormElement>('.consultation__form');
  if (!form) return;
  
  // Remove existing message
  const existingMessage = form.querySelector<HTMLElement>('.form__message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // Create message element
  const messageEl = document.createElement('div');
  messageEl.className = `form__message form__message--${type}`;
  messageEl.textContent = message;
  messageEl.style.cssText = `
    padding: 16px;
    border-radius: 8px;
    margin-top: 16px;
    text-align: center;
    font-weight: 500;
    ${type === 'success' 
      ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' 
      : 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'}
  `;
  
  form.appendChild(messageEl);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    messageEl.remove();
  }, 5000);
}

/**
 * Initialize form module
 */
export function initForm(): void {
  // Record form render time for anti-spam
  formRenderedAt = Date.now();
  
  initTextareaResize();
  initPhotoUpload();
  initFormValidation();
}
