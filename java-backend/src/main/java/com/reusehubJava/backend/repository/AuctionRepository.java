package com.reusehubJava.backend.repository;

import com.reusehubJava.backend.model.Auction;
import com.reusehubJava.backend.model.Item;
import com.reusehubJava.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface AuctionRepository extends JpaRepository<Auction, Long> {
    
    // Find auction by item
    Optional<Auction> findByItem(Item item);
    
    // Find all active auctions
    List<Auction> findByStatusOrderByEndTimeAsc(Auction.AuctionStatus status);
    
    // Find auctions ending soon (within specified minutes)
    @Query("SELECT a FROM Auction a WHERE a.status = :status AND a.endTime BETWEEN :now AND :endTime ORDER BY a.endTime ASC")
    List<Auction> findAuctionsEndingSoon(@Param("status") Auction.AuctionStatus status, 
                                       @Param("now") Date now, 
                                       @Param("endTime") Date endTime);
    
    // Find expired auctions that need to be closed
    @Query("SELECT a FROM Auction a WHERE a.status = :status AND a.endTime < :now")
    List<Auction> findExpiredAuctions(@Param("status") Auction.AuctionStatus status, @Param("now") Date now);
    
    // Find auctions where user is the current winner
    List<Auction> findByCurrentWinnerOrderByEndTimeAsc(User currentWinner);
    
    // Find auctions by seller (through item relationship)
    @Query("SELECT a FROM Auction a WHERE a.item.user = :seller ORDER BY a.startTime DESC")
    List<Auction> findBySellerOrderByStartTimeDesc(@Param("seller") User seller);
    
    // Count active auctions
    Long countByStatus(Auction.AuctionStatus status);
    
    // Find auctions with Buy Now option enabled
    @Query("SELECT a FROM Auction a WHERE a.status = :status AND a.allowBuyNow = true AND a.buyNowPrice IS NOT NULL ORDER BY a.endTime ASC")
    List<Auction> findActiveAuctionsWithBuyNow(@Param("status") Auction.AuctionStatus status);
    
    // Get total count of all auctions
    @Query("SELECT COUNT(a) FROM Auction a")
    Long getTotalCount();
}