package com.reusehubJava.backend.controller;

import com.reusehubJava.backend.model.Bid;
import com.reusehubJava.backend.service.BidService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/bids")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
public class BidController {

    @Autowired
    private BidService bidService;

    /**
     * Place a new bid on an item
     */
    @PostMapping("/place")
    public ResponseEntity<?> placeBid(@RequestBody PlaceBidRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String bidderEmail = authentication.getName();

            Bid bid = bidService.placeBid(request.getItemId(), bidderEmail, request.getBidAmount());
            return ResponseEntity.ok(bid);
            
        } catch (Exception e) {
            System.err.println("Error placing bid: " + e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all bids for a specific item
     */
    @GetMapping("/item/{itemId}")
    public ResponseEntity<List<Bid>> getBidsForItem(@PathVariable Long itemId) {
        try {
            List<Bid> bids = bidService.getBidsForItem(itemId);
            return ResponseEntity.ok(bids);
        } catch (Exception e) {
            System.err.println("Error getting bids for item: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get current user's bidding history
     */
    @GetMapping("/my-bids")
    public ResponseEntity<List<Bid>> getMyBids() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();

            List<Bid> bids = bidService.getUserBids(userEmail);
            return ResponseEntity.ok(bids);
        } catch (Exception e) {
            System.err.println("Error getting user bids: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get current user's winning bids
     */
    @GetMapping("/my-winning-bids")
    public ResponseEntity<List<Bid>> getMyWinningBids() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();

            List<Bid> winningBids = bidService.getUserWinningBids(userEmail);
            return ResponseEntity.ok(winningBids);
        } catch (Exception e) {
            System.err.println("Error getting winning bids: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Check if current user can bid on an item
     */
    @GetMapping("/can-bid/{itemId}")
    public ResponseEntity<Map<String, Boolean>> canBidOnItem(@PathVariable Long itemId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();

            boolean canBid = bidService.canUserBid(itemId, userEmail);
            return ResponseEntity.ok(Map.of("canBid", canBid));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("canBid", false));
        }
    }

    /**
     * Get current highest bid for an item
     */
    @GetMapping("/highest/{itemId}")
    public ResponseEntity<?> getHighestBid(@PathVariable Long itemId) {
        try {
            Optional<Bid> highestBid = bidService.getCurrentHighestBid(itemId);
            if (highestBid.isPresent()) {
                return ResponseEntity.ok(highestBid.get());
            } else {
                return ResponseEntity.ok(Map.of("message", "No bids found"));
            }
        } catch (Exception e) {
            System.err.println("Error getting highest bid: " + e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Cancel a bid (only if not winning)
     */
    @PutMapping("/{bidId}/cancel")
    public ResponseEntity<?> cancelBid(@PathVariable Long bidId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();

            bidService.cancelBid(bidId, userEmail);
            return ResponseEntity.ok(Map.of("message", "Bid cancelled successfully"));
            
        } catch (Exception e) {
            System.err.println("Error cancelling bid: " + e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    // Request DTOs
    public static class PlaceBidRequest {
        private Long itemId;
        private Double bidAmount;

        // Getters and setters
        public Long getItemId() { return itemId; }
        public void setItemId(Long itemId) { this.itemId = itemId; }
        
        public Double getBidAmount() { return bidAmount; }
        public void setBidAmount(Double bidAmount) { this.bidAmount = bidAmount; }
    }
}