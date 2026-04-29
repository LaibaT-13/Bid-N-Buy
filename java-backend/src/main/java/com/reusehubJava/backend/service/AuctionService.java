package com.reusehubJava.backend.service;

import com.reusehubJava.backend.model.*;
import com.reusehubJava.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class AuctionService {

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private BidRepository bidRepository;

    @Autowired
    private ItemRepository itemRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private com.reusehubJava.backend.controller.MessageController messageController;

    /**
     * Create a new auction for an item
     */
    public Auction createAuction(Long itemId, Double startingBid, Double minimumIncrement, 
                                Date endTime, Double reservePrice, Double buyNowPrice, 
                                Boolean allowBuyNow) throws Exception {
        
        Item item = itemRepository.findById(itemId)
            .orElseThrow(() -> new Exception("Item not found"));

        // Check if item already has an auction
        Optional<Auction> existingAuction = auctionRepository.findByItem(item);
        if (existingAuction.isPresent()) {
            throw new Exception("Item already has an active auction");
        }

        // Validate auction parameters
        if (startingBid <= 0) {
            throw new Exception("Starting bid must be greater than 0");
        }

        if (minimumIncrement <= 0) {
            throw new Exception("Minimum increment must be greater than 0");
        }

        Date now = new Date();
        if (endTime.before(now)) {
            throw new Exception("End time must be in the future");
        }

        // Validate buy now price if provided
        if (buyNowPrice != null && buyNowPrice <= startingBid) {
            throw new Exception("Buy now price must be higher than starting bid");
        }

        // Create auction
        Auction auction = new Auction();
        auction.setItem(item);
        auction.setStartingBid(startingBid);
        auction.setCurrentHighestBid(startingBid);
        auction.setMinimumIncrement(minimumIncrement);
        auction.setStartTime(now);
        auction.setEndTime(endTime);
        auction.setStatus(Auction.AuctionStatus.ACTIVE);
        auction.setReservePrice(reservePrice);
        auction.setBuyNowPrice(buyNowPrice);
        auction.setAllowBuyNow(allowBuyNow != null ? allowBuyNow : true);
        auction.setAutoExtendOnLateBid(false); // Can be configured later
        auction.setExtensionTimeMinutes(5);

        // Enable bidding on the item
        item.setBiddingEnabled(true);
        itemRepository.save(item);

        return auctionRepository.save(auction);
    }

    /**
     * Get auction by item ID
     */
    public Optional<Auction> getAuctionByItemId(Long itemId) {
        Item item = itemRepository.findById(itemId).orElse(null);
        if (item == null) {
            return Optional.empty();
        }
        return auctionRepository.findByItem(item);
    }

    /**
     * Get all active auctions
     */
    public List<Auction> getActiveAuctions() {
        return auctionRepository.findByStatusOrderByEndTimeAsc(Auction.AuctionStatus.ACTIVE);
    }

    /**
     * Get auctions ending soon (within next 24 hours)
     */
    public List<Auction> getAuctionsEndingSoon() {
        Date now = new Date();
        Calendar cal = Calendar.getInstance();
        cal.setTime(now);
        cal.add(Calendar.HOUR, 24);
        Date tomorrow = cal.getTime();
        
        return auctionRepository.findAuctionsEndingSoon(
            Auction.AuctionStatus.ACTIVE, now, tomorrow);
    }

    /**
     * Handle "Buy It Now" purchase
     */
    public void buyNow(Long itemId, String buyerEmail) throws Exception {
        
        Item item = itemRepository.findById(itemId)
            .orElseThrow(() -> new Exception("Item not found"));

        Auction auction = auctionRepository.findByItem(item)
            .orElseThrow(() -> new Exception("No auction found for this item"));

        // Validate buy now is allowed
        if (!Boolean.TRUE.equals(auction.getAllowBuyNow())) {
            throw new Exception("Buy It Now is not enabled for this auction");
        }

        if (auction.getBuyNowPrice() == null) {
            throw new Exception("Buy It Now price is not set");
        }

        if (!auction.isActive()) {
            throw new Exception("Auction is not active");
        }

        // End auction and mark as sold
        auction.setStatus(Auction.AuctionStatus.SOLD);
        auction.setEndTime(new Date()); // Set end time to now
        
        // Mark all existing bids as cancelled
        List<Bid> existingBids = bidRepository.findByItemOrderByBidDateDesc(item);
        for (Bid bid : existingBids) {
            if (bid.getStatus() == Bid.BidStatus.WINNING || bid.getStatus() == Bid.BidStatus.ACTIVE) {
                bid.setStatus(Bid.BidStatus.CANCELLED);
                bidRepository.save(bid);
            }
        }

        // Update item status
        item.setStatus(Item.ItemStatus.SOLD);
        item.setAvailable(false);

        // Save changes
        auctionRepository.save(auction);
        itemRepository.save(item);

        // Send notifications
        try {
            // Notify seller
            emailService.sendSaleNotification(
                item.getUser().getUCusMail(),
                item.getIName(),
                buyerEmail,
                auction.getBuyNowPrice(),
                true // isBuyNow
            );
            
            // Find the buyer user to send automatic message
            Optional<User> buyerOpt = userRepository.findByUCusMail(buyerEmail);
            if (buyerOpt.isPresent()) {
                String buyNowMessage = String.format(
                    "✅ Purchase confirmed! You bought '%s' for ৳%.2f using Buy It Now. " +
                    "Please contact the seller to arrange payment and pickup. Item details and seller contact information are in your purchase history.",
                    item.getIName(),
                    auction.getBuyNowPrice()
                );
                messageController.sendAutomaticMessage(buyerOpt.get(), item, buyNowMessage);
            }

            // Notify outbid bidders
            for (Bid bid : existingBids) {
                if (bid.getStatus() == Bid.BidStatus.CANCELLED) {
                    emailService.sendAuctionEndedNotification(
                        bid.getBidder().getUCusMail(),
                        item.getIName(),
                        false, // didWin
                        auction.getBuyNowPrice()
                    );
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to send buy now notification emails: " + e.getMessage());
        }
    }

    /**
     * Scheduled task to close expired auctions
     * Runs every 5 minutes
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    public void closeExpiredAuctions() {
        System.out.println("🕒 Checking for expired auctions...");
        
        Date now = new Date();
        List<Auction> expiredAuctions = auctionRepository.findExpiredAuctions(
            Auction.AuctionStatus.ACTIVE, now);

        System.out.println("📋 Found " + expiredAuctions.size() + " expired auctions");

        for (Auction auction : expiredAuctions) {
            try {
                closeAuction(auction);
            } catch (Exception e) {
                System.err.println("Error closing auction " + auction.getAuctionId() + ": " + e.getMessage());
            }
        }
    }

    /**
     * Close an individual auction
     */
    private void closeAuction(Auction auction) throws Exception {
        System.out.println("🔒 Closing auction for item: " + auction.getItem().getIName());

        auction.setStatus(Auction.AuctionStatus.ENDED);
        
        // Get highest bid
        Optional<Bid> highestBid = bidRepository.findTopByItemOrderByBidAmountDesc(auction.getItem());
        
        if (highestBid.isPresent()) {
            Bid winningBid = highestBid.get();
            
            // Check if reserve price is met (if set)
            boolean reserveMet = auction.getReservePrice() == null || 
                               winningBid.getBidAmount() >= auction.getReservePrice();
            
            if (reserveMet) {
                // Auction successful
                winningBid.setStatus(Bid.BidStatus.WON);
                auction.getItem().setStatus(Item.ItemStatus.SOLD);
                auction.getItem().setAvailable(false);
                auction.setStatus(Auction.AuctionStatus.SOLD);
                
                bidRepository.save(winningBid);
                
                // Send winner notification
                emailService.sendAuctionWonNotification(
                    winningBid.getBidder().getUCusMail(),
                    auction.getItem().getIName(),
                    winningBid.getBidAmount(),
                    auction.getItem().getUser().getUCusMail()
                );
                
                // Send automatic message to winner
                String winnerMessage = String.format(
                    "🎉 Congratulations! You won the auction for '%s' with a bid of ৳%.2f. " +
                    "Please contact the seller to arrange payment and pickup. Item details and seller contact information are in your purchase history.",
                    auction.getItem().getIName(),
                    winningBid.getBidAmount()
                );
                messageController.sendAutomaticMessage(winningBid.getBidder(), auction.getItem(), winnerMessage);
                
                // Send seller notification
                emailService.sendSaleNotification(
                    auction.getItem().getUser().getUCusMail(),
                    auction.getItem().getIName(),
                    winningBid.getBidder().getUCusMail(),
                    winningBid.getBidAmount(),
                    false // not buy now
                );
                
            } else {
                // Reserve not met
                winningBid.setStatus(Bid.BidStatus.CANCELLED);
                bidRepository.save(winningBid);
                
                emailService.sendAuctionEndedNotification(
                    winningBid.getBidder().getUCusMail(),
                    auction.getItem().getIName(),
                    false, // didn't win
                    auction.getReservePrice()
                );
            }
            
            // Mark all other bids as cancelled
            List<Bid> allBids = bidRepository.findByItemOrderByBidDateDesc(auction.getItem());
            for (Bid bid : allBids) {
                if (!bid.getBidId().equals(winningBid.getBidId()) && 
                    bid.getStatus() != Bid.BidStatus.CANCELLED) {
                    bid.setStatus(Bid.BidStatus.CANCELLED);
                    bidRepository.save(bid);
                    
                    emailService.sendAuctionEndedNotification(
                        bid.getBidder().getUCusMail(),
                        auction.getItem().getIName(),
                        false, // didn't win
                        winningBid.getBidAmount()
                    );
                }
            }
        } else {
            // No bids received
            System.out.println("📭 No bids received for auction: " + auction.getItem().getIName());
        }

        auctionRepository.save(auction);
        itemRepository.save(auction.getItem());
        
        System.out.println("✅ Successfully closed auction for: " + auction.getItem().getIName());
    }

    /**
     * Get user's auctions (as seller)
     */
    public List<Auction> getUserAuctions(String sellerEmail) {
        User seller = userRepository.findByUCusMail(sellerEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return auctionRepository.findBySellerOrderByStartTimeDesc(seller);
    }

    /**
     * Cancel an auction (only if no bids placed)
     */
    public void cancelAuction(Long auctionId, String sellerEmail) throws Exception {
        Auction auction = auctionRepository.findById(auctionId)
            .orElseThrow(() -> new Exception("Auction not found"));

        User seller = userRepository.findByUCusMail(sellerEmail)
            .orElseThrow(() -> new Exception("User not found"));

        // Check if user owns the auction
        if (!auction.getItem().getUser().getUserId().equals(seller.getUserId())) {
            throw new Exception("You can only cancel your own auctions");
        }

        // Check if auction is active
        if (auction.getStatus() != Auction.AuctionStatus.ACTIVE) {
            throw new Exception("Can only cancel active auctions");
        }

        // Check if there are any bids
        List<Bid> existingBids = bidRepository.findByItemOrderByBidDateDesc(auction.getItem());
        if (!existingBids.isEmpty()) {
            throw new Exception("Cannot cancel auction with existing bids");
        }

        // Cancel auction
        auction.setStatus(Auction.AuctionStatus.CANCELLED);
        auction.getItem().setBiddingEnabled(false);
        
        auctionRepository.save(auction);
        itemRepository.save(auction.getItem());
    }
}