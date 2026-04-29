package com.reusehubJava.backend.repository;

import com.reusehubJava.backend.model.Bid;
import com.reusehubJava.backend.model.Item;
import com.reusehubJava.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface BidRepository extends JpaRepository<Bid, Long> {
    
    // Find all bids for a specific item, ordered by bid amount (highest first)
    List<Bid> findByItemOrderByBidAmountDesc(Item item);
    
    // Find all bids for a specific item, ordered by bid date (newest first)
    List<Bid> findByItemOrderByBidDateDesc(Item item);
    
    // Find all bids by a specific user
    List<Bid> findByBidderOrderByBidDateDesc(User bidder);
    
    // Find the highest bid for a specific item
    Optional<Bid> findTopByItemOrderByBidAmountDesc(Item item);
    
    // Find active bids for a specific item
    List<Bid> findByItemAndStatusOrderByBidAmountDesc(Item item, Bid.BidStatus status);
    
    // Count total bids for an item
    Long countByItem(Item item);
    
    // Find all bids by a user for a specific item
    List<Bid> findByBidderAndItemOrderByBidDateDesc(User bidder, Item item);
    
    // Check if user has already bid on an item
    boolean existsByBidderAndItem(User bidder, Item item);
    
    // Find winning bids (status = WON)
    List<Bid> findByBidderAndStatusOrderByBidDateDesc(User bidder, Bid.BidStatus status);
    
    // Get bid statistics
    @Query("SELECT COUNT(b) FROM Bid b WHERE b.bidder = :bidder")
    Long countByBidder(@Param("bidder") User bidder);
    
    @Query("SELECT COUNT(b) FROM Bid b WHERE b.bidder = :bidder AND b.status = :status")
    Long countByBidderAndStatus(@Param("bidder") User bidder, @Param("status") Bid.BidStatus status);
}