package com.reusehubJava.backend.controller;

import com.reusehubJava.backend.model.Auction;
import com.reusehubJava.backend.service.AuctionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auctions")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
public class AuctionController {

    @Autowired
    private AuctionService auctionService;

    /**
     * Create a new auction for an item
     */
    @PostMapping("/create")
    public ResponseEntity<?> createAuction(@RequestBody CreateAuctionRequest request) {
        try {
            Auction auction = auctionService.createAuction(
                request.getItemId(),
                request.getStartingBid(),
                request.getMinimumIncrement(),
                request.getEndTime(),
                request.getReservePrice(),
                request.getBuyNowPrice(),
                request.getAllowBuyNow()
            );
            return ResponseEntity.ok(auction);
        } catch (Exception e) {
            System.err.println("Error creating auction: " + e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get auction details by item ID
     */
    @GetMapping("/item/{itemId}")
    public ResponseEntity<?> getAuctionByItemId(@PathVariable Long itemId) {
        try {
            Optional<Auction> auction = auctionService.getAuctionByItemId(itemId);
            if (auction.isPresent()) {
                return ResponseEntity.ok(auction.get());
            } else {
                return ResponseEntity.ok(Map.of("message", "No auction found for this item"));
            }
        } catch (Exception e) {
            System.err.println("Error getting auction: " + e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all active auctions
     */
    @GetMapping("/active")
    public ResponseEntity<List<Auction>> getActiveAuctions() {
        try {
            List<Auction> auctions = auctionService.getActiveAuctions();
            return ResponseEntity.ok(auctions);
        } catch (Exception e) {
            System.err.println("Error getting active auctions: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get auctions ending soon
     */
    @GetMapping("/ending-soon")
    public ResponseEntity<List<Auction>> getAuctionsEndingSoon() {
        try {
            List<Auction> auctions = auctionService.getAuctionsEndingSoon();
            return ResponseEntity.ok(auctions);
        } catch (Exception e) {
            System.err.println("Error getting auctions ending soon: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Buy It Now - immediately purchase item at buy now price
     */
    @PostMapping("/buy-now/{itemId}")
    public ResponseEntity<?> buyNow(@PathVariable Long itemId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String buyerEmail = authentication.getName();

            auctionService.buyNow(itemId, buyerEmail);
            return ResponseEntity.ok(Map.of("message", "Item purchased successfully"));
            
        } catch (Exception e) {
            System.err.println("Error processing Buy It Now: " + e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get current user's auctions (as seller)
     */
    @GetMapping("/my-auctions")
    public ResponseEntity<List<Auction>> getMyAuctions() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String sellerEmail = authentication.getName();

            List<Auction> auctions = auctionService.getUserAuctions(sellerEmail);
            return ResponseEntity.ok(auctions);
        } catch (Exception e) {
            System.err.println("Error getting user auctions: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Cancel an auction (only if no bids)
     */
    @PutMapping("/{auctionId}/cancel")
    public ResponseEntity<?> cancelAuction(@PathVariable Long auctionId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String sellerEmail = authentication.getName();

            auctionService.cancelAuction(auctionId, sellerEmail);
            return ResponseEntity.ok(Map.of("message", "Auction cancelled successfully"));
            
        } catch (Exception e) {
            System.err.println("Error cancelling auction: " + e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    // Request DTOs
    public static class CreateAuctionRequest {
        private Long itemId;
        private Double startingBid;
        private Double minimumIncrement;
        private Date endTime;
        private Double reservePrice;
        private Double buyNowPrice;
        private Boolean allowBuyNow;

        // Getters and setters
        public Long getItemId() { return itemId; }
        public void setItemId(Long itemId) { this.itemId = itemId; }
        
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