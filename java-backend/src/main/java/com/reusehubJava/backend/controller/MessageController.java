package com.reusehubJava.backend.controller;

import com.reusehubJava.backend.model.Message;
import com.reusehubJava.backend.model.MessageReport;
import com.reusehubJava.backend.model.User;
import com.reusehubJava.backend.model.Item;
import com.reusehubJava.backend.repository.MessageRepository;
import com.reusehubJava.backend.repository.MessageReportRepository;
import com.reusehubJava.backend.repository.UserRepository;
import com.reusehubJava.backend.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private MessageReportRepository messageReportRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ItemRepository itemRepository;

    // Send a new message
    @PostMapping("/send")
    public ResponseEntity<Message> sendMessage(@RequestBody MessageRequest request) {
        try {
            // Get current user from security context
            String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<User> senderOpt = userRepository.findByUCusMail(currentUserEmail);
            
            if (!senderOpt.isPresent()) {
                return new ResponseEntity<>(null, HttpStatus.UNAUTHORIZED);
            }

            // Find receiver
            Optional<User> receiverOpt = userRepository.findByUCusMail(request.getReceiverEmail());
            if (!receiverOpt.isPresent()) {
                return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
            }

            Message message = new Message();
            message.setSender(senderOpt.get());
            message.setReceiver(receiverOpt.get());
            message.setContent(request.getContent());
            message.setSentDate(new Date());
            message.setIsRead(false);

            // If message is about an item
            if (request.getItemId() != null) {
                Optional<Item> itemOpt = itemRepository.findById(request.getItemId());
                itemOpt.ifPresent(message::setItem);
            }

            Message savedMessage = messageRepository.save(message);
            return new ResponseEntity<>(savedMessage, HttpStatus.CREATED);

        } catch (Exception e) {
            System.out.println("Error sending message: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get conversation between current user and another user
    @GetMapping("/conversation/{otherUserEmail}")
    public ResponseEntity<List<Message>> getConversation(@PathVariable String otherUserEmail) {
        try {
            String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<User> currentUserOpt = userRepository.findByUCusMail(currentUserEmail);
            Optional<User> otherUserOpt = userRepository.findByUCusMail(otherUserEmail);

            if (!currentUserOpt.isPresent() || !otherUserOpt.isPresent()) {
                return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
            }

            List<Message> conversation = messageRepository.findConversationBetweenUsers(
                currentUserOpt.get(), otherUserOpt.get()
            );

            return new ResponseEntity<>(conversation, HttpStatus.OK);

        } catch (Exception e) {
            System.out.println("Error getting conversation: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get all conversations for current user
    @GetMapping("/conversations")
    public ResponseEntity<List<Message>> getUserConversations() {
        try {
            String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<User> currentUserOpt = userRepository.findByUCusMail(currentUserEmail);

            if (!currentUserOpt.isPresent()) {
                return new ResponseEntity<>(null, HttpStatus.UNAUTHORIZED);
            }

            User currentUser = currentUserOpt.get();
            List<Message> allMessages = messageRepository.findAllMessagesForUser(currentUser);
            
            // Process to get latest message from each conversation
            List<Message> conversations = new ArrayList<>();
            List<String> processedUsers = new ArrayList<>();
            
            for (Message message : allMessages) {
                String otherUserEmail;
                if (message.getSender().getUserId().equals(currentUser.getUserId())) {
                    otherUserEmail = message.getReceiver().getUCusMail();
                } else {
                    otherUserEmail = message.getSender().getUCusMail();
                }
                
                if (!processedUsers.contains(otherUserEmail)) {
                    conversations.add(message);
                    processedUsers.add(otherUserEmail);
                }
            }
            
            return new ResponseEntity<>(conversations, HttpStatus.OK);

        } catch (Exception e) {
            System.out.println("Error getting conversations: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Mark message as read
    @PutMapping("/read/{messageId}")
    public ResponseEntity<String> markAsRead(@PathVariable Long messageId) {
        try {
            Optional<Message> messageOpt = messageRepository.findById(messageId);
            if (!messageOpt.isPresent()) {
                return new ResponseEntity<>("Message not found", HttpStatus.NOT_FOUND);
            }

            Message message = messageOpt.get();
            message.setIsRead(true);
            messageRepository.save(message);

            return new ResponseEntity<>("Message marked as read", HttpStatus.OK);

        } catch (Exception e) {
            System.out.println("Error marking message as read: " + e.getMessage());
            return new ResponseEntity<>("Error", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get unread message count
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount() {
        try {
            String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<User> currentUserOpt = userRepository.findByUCusMail(currentUserEmail);

            if (!currentUserOpt.isPresent()) {
                return new ResponseEntity<>(0L, HttpStatus.UNAUTHORIZED);
            }

            Long unreadCount = messageRepository.countUnreadMessagesForUser(currentUserOpt.get());
            return new ResponseEntity<>(unreadCount, HttpStatus.OK);

        } catch (Exception e) {
            System.out.println("Error getting unread count: " + e.getMessage());
            return new ResponseEntity<>(0L, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // DTO for message requests
    public static class MessageRequest {
        private String receiverEmail;
        private String content;
        private Long itemId;

        // Getters and setters
        public String getReceiverEmail() { return receiverEmail; }
        public void setReceiverEmail(String receiverEmail) { this.receiverEmail = receiverEmail; }

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }

        public Long getItemId() { return itemId; }
        public void setItemId(Long itemId) { this.itemId = itemId; }
    }

    // Report a message
    @PostMapping("/report")
    public ResponseEntity<MessageReport> reportMessage(@RequestBody ReportMessageRequest request) {
        try {
            String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<User> reporterOpt = userRepository.findByUCusMail(currentUserEmail);
            
            if (!reporterOpt.isPresent()) {
                return new ResponseEntity<>(null, HttpStatus.UNAUTHORIZED);
            }

            Optional<Message> messageOpt = messageRepository.findById(request.getMessageId());
            if (!messageOpt.isPresent()) {
                return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
            }

            User reporter = reporterOpt.get();
            Message message = messageOpt.get();

            // Check if user has already reported this message
            Optional<MessageReport> existingReport = messageReportRepository.findByMessageAndReporter(message, reporter);
            if (existingReport.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(null); // User has already reported this message
            }

            // Prevent users from reporting their own messages
            if (message.getSender().getUserId().equals(reporter.getUserId())) {
                return ResponseEntity.badRequest()
                    .body(null); // Cannot report own message
            }

            MessageReport report = new MessageReport();
            report.setMessage(message);
            report.setReporter(reporter);
            report.setReason(request.getReason());
            report.setAdditionalDetails(request.getAdditionalDetails());
            report.setReportedDate(new Date());
            report.setStatus(MessageReport.ReportStatus.PENDING);

            MessageReport savedReport = messageReportRepository.save(report);
            
            System.out.println("📢 Message reported: " + message.getContent().substring(0, Math.min(50, message.getContent().length())) + 
                             " by " + reporter.getUName() + " for reason: " + request.getReason());
                             
            return new ResponseEntity<>(savedReport, HttpStatus.CREATED);

        } catch (Exception e) {
            System.out.println("Error reporting message: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get reports made by current user
    @GetMapping("/my-reports")
    public ResponseEntity<List<MessageReport>> getMyReports() {
        try {
            String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<User> userOpt = userRepository.findByUCusMail(currentUserEmail);
            
            if (!userOpt.isPresent()) {
                return new ResponseEntity<>(null, HttpStatus.UNAUTHORIZED);
            }

            List<MessageReport> reports = messageReportRepository.findByReporter(userOpt.get());
            return new ResponseEntity<>(reports, HttpStatus.OK);

        } catch (Exception e) {
            System.out.println("Error getting user reports: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Service method to send automatic system messages
     * Used for auction wins and buy-now purchases
     */
    public void sendAutomaticMessage(User receiver, Item item, String messageContent) {
        try {
            // Create system message from the item owner
            User systemSender = item.getUser(); // Use item owner as sender
            
            Message message = new Message();
            message.setSender(systemSender);
            message.setReceiver(receiver);
            message.setContent(messageContent);
            message.setSentDate(new Date());
            message.setIsRead(false);
            message.setItem(item);
            
            messageRepository.save(message);
            System.out.println("✅ Automatic message sent to " + receiver.getUName() + " about item: " + item.getIName());
            
        } catch (Exception e) {
            System.err.println("❌ Error sending automatic message: " + e.getMessage());
        }
    }

    // DTO for reporting a message
    public static class ReportMessageRequest {
        private Long messageId;
        private MessageReport.ReportReason reason;
        private String additionalDetails;

        // Getters and setters
        public Long getMessageId() { return messageId; }
        public void setMessageId(Long messageId) { this.messageId = messageId; }

        public MessageReport.ReportReason getReason() { return reason; }
        public void setReason(MessageReport.ReportReason reason) { this.reason = reason; }

        public String getAdditionalDetails() { return additionalDetails; }
        public void setAdditionalDetails(String additionalDetails) { this.additionalDetails = additionalDetails; }
    }
}
