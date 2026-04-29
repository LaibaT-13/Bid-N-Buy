package com.reusehubJava.backend.controller;

import com.reusehubJava.backend.model.Item;
import com.reusehubJava.backend.model.User;
import com.reusehubJava.backend.model.Admin;
import com.reusehubJava.backend.dto.ItemResponseDTO;
import com.reusehubJava.backend.repository.ItemRepository;
import com.reusehubJava.backend.repository.UserRepository;
import com.reusehubJava.backend.repository.AdminRepository;
import com.reusehubJava.backend.repository.ReportRepository;
import com.reusehubJava.backend.service.AuctionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"}, methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class ItemController {

    @Autowired
    private ItemRepository itemRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AdminRepository adminRepository;
    
    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private AuctionService auctionService;

    // This endpoint requires a valid JWT in the Authorization header (ROLE_USER or ROLE_ADMIN)
    // Only returns APPROVED and AVAILABLE items for regular users
    @GetMapping
    public List<Item> getAllItems() {
        System.out.println("🔍 GET /api/items called at " + new java.util.Date());
        
        // First, let's check what items exist in total
        List<Item> allItems = itemRepository.findAll();
        System.out.println("📊 Total items in database: " + allItems.size());
        
        // Log all items with their status
        for (Item item : allItems) {
            System.out.println("📦 Item " + item.getItemId() + ": " + item.getIName() + 
                             " - Status: " + item.getStatus() + 
                             " - Available: " + item.getAvailable());
        }
        
        // Return only approved and available items - no temporary fallbacks
        List<Item> approvedItems = itemRepository.findByStatusAndAvailableOrderByPostDateDesc(Item.ItemStatus.APPROVED, true);
        System.out.println("✅ Found " + approvedItems.size() + " approved and available items");
        
        // Log each approved item for debugging
        for (Item item : approvedItems) {
            System.out.println("📦 Approved item: " + item.getIName() + 
                             " (ID: " + item.getItemId() + 
                             ", Status: " + item.getStatus() + 
                             ", Available: " + item.getAvailable() + 
                             ", BiddingEnabled: " + item.getBiddingEnabled() + ")");
        }
        
        return approvedItems;
    }

    // Get item by ID
    @GetMapping("/{itemId}")
    public ResponseEntity<Item> getItemById(@PathVariable Long itemId) {
        try {
            return itemRepository.findById(itemId)
                .map(item -> ResponseEntity.ok(item))
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // This endpoint also requires a valid JWT 
    @PostMapping
    public ResponseEntity<Item> createItem(@RequestBody Item item) {
        try {
            System.out.println("🔵 POST /api/items called");
            System.out.println("📦 Received item data:");
            System.out.println("   - iName: " + item.getIName());
            System.out.println("   - description: " + item.getDescription());
            System.out.println("   - category: " + item.getCategory());
            System.out.println("   - price: " + item.getPrice());
            System.out.println("   - condition: " + item.getCondition());
            System.out.println("   - location: " + item.getLocation());
            System.out.println("   - image: " + item.getImage());
            
            // Get the authenticated user from SecurityContext
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            System.out.println("👤 Authenticated user: " + userEmail);
            
            // Find the user by email
            User user = userRepository.findByUCusMail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
            System.out.println("✅ User found: " + user.getUName() + " (ID: " + user.getUserId() + ")");
            
            // Set the user, timestamps, and status
            item.setUser(user);
            item.setPostDate(new Date());
            item.setUpdateDate(new Date());
            item.setStatus(Item.ItemStatus.PENDING); // All new items go to pending status
            item.setAvailable(true); // Explicitly set as available
            
            System.out.println("💾 Saving item with status: " + item.getStatus());
            Item savedItem = itemRepository.save(item);
            System.out.println("✅ Item saved successfully:");
            System.out.println("   - ID: " + savedItem.getItemId());
            System.out.println("   - iName: " + savedItem.getIName());
            System.out.println("   - status: " + savedItem.getStatus());
            System.out.println("   - available: " + savedItem.getAvailable());
            
            return ResponseEntity.ok(savedItem);
        } catch (Exception e) {
            System.out.println("❌ Error creating item: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    // Create item with auction details
    @PostMapping("/with-auction")
    public ResponseEntity<?> createItemWithAuction(@RequestBody CreateItemWithAuctionRequest request) {
        try {
            System.out.println("🔵 POST /api/items/with-auction called");
            System.out.println("📦 Received item with auction data:");
            System.out.println("   - iName: " + request.getItem().getIName());
            System.out.println("   - biddingEnabled: " + request.getItem().getBiddingEnabled());
            if (request.getAuctionData() != null) {
                System.out.println("   - startingBid: " + request.getAuctionData().getStartingBid());
                System.out.println("   - endTime: " + request.getAuctionData().getEndTime());
            }
            
            // Get the authenticated user from SecurityContext
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            // Find the user by email
            User user = userRepository.findByUCusMail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Set basic item properties
            Item item = request.getItem();
            item.setUser(user);
            item.setPostDate(new Date());
            item.setUpdateDate(new Date());
            item.setStatus(Item.ItemStatus.PENDING);
            item.setAvailable(true);
            
            // Save the item first
            Item savedItem = itemRepository.save(item);
            System.out.println("✅ Item saved with ID: " + savedItem.getItemId());
            
            // If bidding is enabled and auction data is provided, create auction
            if (Boolean.TRUE.equals(savedItem.getBiddingEnabled()) && request.getAuctionData() != null) {
                System.out.println("🔨 Creating auction for item...");
                
                AuctionData auctionData = request.getAuctionData();
                auctionService.createAuction(
                    savedItem.getItemId(),
                    auctionData.getStartingBid(),
                    auctionData.getMinimumIncrement(),
                    auctionData.getEndTime(),
                    auctionData.getReservePrice(),
                    auctionData.getBuyNowPrice(),
                    auctionData.getAllowBuyNow()
                );
                System.out.println("✅ Auction created successfully");
            }
            
            return ResponseEntity.ok(Map.of(
                "message", "Item created successfully",
                "item", savedItem
            ));
            
        } catch (Exception e) {
            System.out.println("❌ Error creating item with auction: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    // Admin endpoints for item management
    @GetMapping("/admin/pending")
    public ResponseEntity<List<ItemResponseDTO>> getPendingItems() {
        try {
            System.out.println("🔍 GET /api/items/admin/pending called");
            
            // TEMPORARY: Skip admin check for testing
            /*
            if (!isCurrentUserAdmin()) {
                System.out.println("❌ User is not admin");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            */
            System.out.println("✅ Admin check bypassed for testing");
            
            List<Item> pendingItems = itemRepository.findByStatus(Item.ItemStatus.PENDING);
            System.out.println("📊 Found " + pendingItems.size() + " pending items");
            
            // Convert to DTOs to avoid Hibernate proxy serialization issues
            List<ItemResponseDTO> itemDTOs = new ArrayList<>();
            for (Item item : pendingItems) {
                try {
                    ItemResponseDTO dto = new ItemResponseDTO(item);
                    itemDTOs.add(dto);
                    System.out.println("✅ Successfully converted item: " + item.getItemId());
                } catch (Exception e) {
                    System.err.println("❌ Error converting item " + item.getItemId() + ": " + e.getMessage());
                    e.printStackTrace();
                }
            }
            
            System.out.println("📊 Successfully converted " + itemDTOs.size() + "/" + pendingItems.size() + " items");
            return ResponseEntity.ok(itemDTOs);
            
        } catch (Exception e) {
            System.out.println("❌ Error getting pending items: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ArrayList<>());
        }
    }

    @GetMapping("/admin/all")
    public ResponseEntity<List<Item>> getAllItemsForAdmin() {
        try {
            // Check if current user is admin
            if (!isCurrentUserAdmin()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            List<Item> allItems = itemRepository.findAll();
            return ResponseEntity.ok(allItems);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/admin/{itemId}/approve")
    public ResponseEntity<ItemResponseDTO> approveItem(@PathVariable Long itemId) {
        try {
            System.out.println("🔍 Approve item request for ID: " + itemId);
            
            // TEMPORARY: Bypass admin check for testing
            System.out.println("✅ Admin check bypassed for testing");
            
            Optional<Item> itemOpt = itemRepository.findById(itemId);
            if (!itemOpt.isPresent()) {
                System.out.println("❌ Item not found with ID: " + itemId);
                return ResponseEntity.notFound().build();
            }

            Item item = itemOpt.get();
            System.out.println("📝 Current item status: " + item.getStatus());
            
            // Try to get current admin, but don't fail if not found
            Admin admin = null;
            try {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                String adminEmail = authentication.getName();
                admin = adminRepository.findByAEmail(adminEmail).orElse(null);
                System.out.println("👤 Admin found: " + (admin != null ? admin.getAName() : "none"));
            } catch (Exception e) {
                System.out.println("⚠️ Could not find admin, proceeding without admin reference");
            }

            item.setStatus(Item.ItemStatus.APPROVED);
            item.setApprovedBy(admin); // This can be null for testing
            item.setApprovedDate(new Date());
            item.setUpdateDate(new Date()); // reflect latest update
            item.setAvailable(true); // ensure visible in listings
            item.setRejectionReason(null); // Clear any previous rejection reason

            Item approvedItem = itemRepository.save(item);
            System.out.println("✅ Item approved successfully: " + approvedItem.getItemId());
            ItemResponseDTO dto = new ItemResponseDTO(approvedItem);
            return ResponseEntity.ok(dto);
            
        } catch (Exception e) {
            System.out.println("❌ Error approving item: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/admin/{itemId}/reject")
    public ResponseEntity<ItemResponseDTO> rejectItem(@PathVariable Long itemId, @RequestBody RejectRequest rejectRequest) {
        try {
            System.out.println("🔍 Reject item request for ID: " + itemId);
            System.out.println("📝 Rejection reason: " + rejectRequest.getReason());
            
            // TEMPORARY: Bypass admin check for testing
            System.out.println("✅ Admin check bypassed for testing");
            
            Optional<Item> itemOpt = itemRepository.findById(itemId);
            if (!itemOpt.isPresent()) {
                System.out.println("❌ Item not found with ID: " + itemId);
                return ResponseEntity.notFound().build();
            }

            Item item = itemOpt.get();
            System.out.println("📝 Current item status: " + item.getStatus());
            
            // Try to get current admin, but don't fail if not found
            Admin admin = null;
            try {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                String adminEmail = authentication.getName();
                admin = adminRepository.findByAEmail(adminEmail).orElse(null);
                System.out.println("👤 Admin found: " + (admin != null ? admin.getAName() : "none"));
            } catch (Exception e) {
                System.out.println("⚠️ Could not find admin, proceeding without admin reference");
            }

            item.setStatus(Item.ItemStatus.REJECTED);
            item.setApprovedBy(admin); // This can be null for testing
            item.setApprovedDate(new Date());
            item.setRejectionReason(rejectRequest.getReason());

            Item rejectedItem = itemRepository.save(item);
            System.out.println("✅ Item rejected successfully: " + rejectedItem.getItemId());
            ItemResponseDTO dto = new ItemResponseDTO(rejectedItem);
            return ResponseEntity.ok(dto);
            
        } catch (Exception e) {
            System.out.println("❌ Error rejecting item: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/admin/pending-count")
    public ResponseEntity<Long> getPendingItemsCount() {
        try {
            // Check if current user is admin
            if (!isCurrentUserAdmin()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Long count = itemRepository.countByStatus(Item.ItemStatus.PENDING);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get current user's items (including pending ones)
    @GetMapping("/my-items")
    public ResponseEntity<List<Item>> getMyItems() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            User user = userRepository.findByUCusMail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            List<Item> userItems = itemRepository.findByUserOrderByPostDateDesc(user);
            return ResponseEntity.ok(userItems);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get current user's pending items
    @GetMapping("/my-items/pending")
    public ResponseEntity<List<Item>> getMyPendingItems() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            User user = userRepository.findByUCusMail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            List<Item> pendingItems = itemRepository.findByUserAndStatusOrderByPostDateDesc(user, Item.ItemStatus.PENDING);
            return ResponseEntity.ok(pendingItems);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Helper method to check if current user is admin
    private boolean isCurrentUserAdmin() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            if (userEmail == null || userEmail.equals("anonymousUser")) {
                return false;
            }
            
            // Check if this email exists in Admin entity
            Optional<Admin> admin = adminRepository.findByAEmail(userEmail);
            boolean isAdmin = admin.isPresent() && admin.get().getStatus() == Admin.AdminStatus.ACTIVE;
            
            System.out.println("� Checking admin status for: " + userEmail + " -> " + (isAdmin ? "✅ IS ADMIN" : "❌ NOT ADMIN"));
            
            return isAdmin;
        } catch (Exception e) {
            System.out.println("❌ Error checking admin status: " + e.getMessage());
            return false;
        }
    }

    // Delete user's own item
    @DeleteMapping("/my-items/{itemId}")
    public ResponseEntity<?> deleteMyItem(@PathVariable Long itemId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            User user = userRepository.findByUCusMail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            Optional<Item> itemOpt = itemRepository.findById(itemId);
            if (itemOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Item item = itemOpt.get();
            
            // Check if the item belongs to the current user or if user is admin
            boolean canDelete = item.getUser().getUserId().equals(user.getUserId()) || 
                               adminRepository.existsByAEmail(userEmail);
            
            if (!canDelete) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You can only delete your own items"));
            }
            
            // Delete related reports first to handle foreign key constraints
            try {
                reportRepository.deleteByItemItemId(itemId);
                System.out.println("🗑️ Deleted related reports for item: " + itemId);
            } catch (Exception e) {
                System.out.println("⚠️ No reports to delete for item: " + itemId);
            }
            
            // Now delete the item
            itemRepository.delete(item);
            System.out.println("🗑️ Item deleted successfully: " + itemId + " by user: " + userEmail);
            return ResponseEntity.ok(Map.of("message", "Item deleted successfully"));
            
        } catch (Exception e) {
            System.err.println("❌ Failed to delete item " + itemId + ": " + e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to delete item: " + e.getMessage()));
        }
    }

    // Update item sale status (SOLD/UNSOLD) by seller
    @PutMapping("/my-items/{itemId}/status")
    public ResponseEntity<?> updateItemStatus(@PathVariable Long itemId, @RequestBody StatusUpdateRequest request) {
        try {
            System.out.println("🔄 Status update request for item " + itemId + " to status: " + request.getStatus());
            
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("🔐 Authentication: " + authentication);
            System.out.println("🔐 Principal: " + authentication.getName());
            
            String userEmail = authentication.getName();
            
            User user = userRepository.findByUCusMail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));
            
            System.out.println("👤 User found: " + user.getUCusMail() + " (ID: " + user.getUserId() + ")");
            
            Optional<Item> itemOpt = itemRepository.findById(itemId);
            if (itemOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Item item = itemOpt.get();
            
            // Check if the item belongs to the current user
            if (!item.getUser().getUserId().equals(user.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You can only update your own items"));
            }
            
            // Validate status
            if (!request.getStatus().equals("SOLD") && !request.getStatus().equals("UNSOLD")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Status must be SOLD or UNSOLD"));
            }
            
            // Only allow status change for APPROVED items
            if (item.getStatus() != Item.ItemStatus.APPROVED && 
                item.getStatus() != Item.ItemStatus.SOLD && 
                item.getStatus() != Item.ItemStatus.UNSOLD) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Can only update status of approved items"));
            }
            
            // Update status
            if (request.getStatus().equals("SOLD")) {
                item.setStatus(Item.ItemStatus.SOLD);
                item.setAvailable(false); // Item no longer available
            } else {
                item.setStatus(Item.ItemStatus.UNSOLD);
                item.setAvailable(true); // Item is available again
            }
            
            item.setUpdateDate(new Date());
            itemRepository.save(item);
            
            System.out.println("📦 Item status updated to " + request.getStatus() + " for item: " + itemId);
            return ResponseEntity.ok(Map.of(
                "message", "Item status updated successfully",
                "status", request.getStatus()
            ));
            
        } catch (Exception e) {
            System.err.println("❌ Failed to update item status " + itemId + ": " + e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to update item status: " + e.getMessage()));
        }
    }

    // DTO for status update request
    public static class StatusUpdateRequest {
        private String status;
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    // Get total count of all items
    @GetMapping("/count")
    public ResponseEntity<Long> getTotalItemCount() {
        try {
            Long count = itemRepository.count();
            System.out.println("📊 Total items count: " + count);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            System.out.println("❌ Error getting item count: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(0L);
        }
    }

    // DTO for rejection request
    public static class RejectRequest {
        private String reason;

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    // DTOs for item with auction creation
    public static class CreateItemWithAuctionRequest {
        private Item item;
        private AuctionData auctionData;

        public Item getItem() { return item; }
        public void setItem(Item item) { this.item = item; }
        
        public AuctionData getAuctionData() { return auctionData; }
        public void setAuctionData(AuctionData auctionData) { this.auctionData = auctionData; }
    }

    public static class AuctionData {
        private Double startingBid;
        private Double minimumIncrement;
        private Date endTime;
        private Double reservePrice;
        private Double buyNowPrice;
        private Boolean allowBuyNow;

        public Double getStartingBid() { return startingBid; }
        public void setStartingBid(Double startingBid) { this.startingBid = startingBid; }
        
        public Double getMinimumIncrement() { return minimumIncrement; }
        public void setMinimumIncrement(Double minimumIncrement) { this.minimumIncrement = minimumIncrement; }
        
        public Date getEndTime() { return endTime; }
        public void setEndTime(Date endTime) { this.endTime = endTime; }
        
        public Double getReservePrice() { return reservePrice; }
        public void setReservePrice(Double reservePrice) { this.reservePrice = reservePrice; }
        
        public Double getBuyNowPrice() { return buyNowPrice; }
        public void setBuyNowPrice(Double buyNowPrice) { this.buyNowPrice = buyNowPrice; }
        
        public Boolean getAllowBuyNow() { return allowBuyNow; }
        public void setAllowBuyNow(Boolean allowBuyNow) { this.allowBuyNow = allowBuyNow; }
    }
}
