package com.reusehubJava.backend.service;

import com.reusehubJava.backend.model.*;
import com.reusehubJava.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class BidService {

    @Autowired
    private BidRepository bidRepository;

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Place a new bid on an item
     */
    public Bid placeBid(Long itemId, String bidderEmail, Double bidAmount) throws Exception {
        
        // Find the item
        Item item = itemRepository.findById(itemId)
            .orElseThrow(() -> new Exception("Item not found"));

        // Find the bidder
        User bidder = userRepository.findByUCusMail(bidderEmail)
            .orElseThrow(() -> new Exception("Bidder not found"));

        // Check if item has bidding enabled
        if (!Boolean.TRUE.equals(item.getBiddingEnabled())) {
            throw new Exception("This item does not allow bidding");
        }

        // Find the associated auction
        Auction auction = auctionRepository.findByItem(item)
            .orElseThrow(() -> new Exception("No active auction found for this item"));

        // Validate auction is active and can accept bids
        if (!auction.isActive()) {
            throw new Exception("Auction is not active");
        }

        if (!auction.canAcceptBid(bidAmount)) {
            throw new Exception("Bid amount must be at least ৳" + 
                (auction.getCurrentHighestBid() + auction.getMinimumIncrement()));
        }

        // Check if bidder is not the item owner
        if (item.getUser().getUserId().equals(bidder.getUserId())) {
            throw new Exception("You cannot bid on your own item");
        }

        // Update previous highest bidder status
        if (auction.getCurrentWinner() != null) {
            List<Bid> previousWinningBids = bidRepository.findByBidderAndStatusOrderByBidDateDesc(
                auction.getCurrentWinner(), Bid.BidStatus.WINNING);
            
            for (Bid prevBid : previousWinningBids) {
                if (prevBid.getItem().getItemId().equals(itemId)) {
                    prevBid.setStatus(Bid.BidStatus.OUTBID);
                    bidRepository.save(prevBid);
                }
            }
        }

        // Create new bid
        Bid newBid = new Bid();
        newBid.setItem(item);
        newBid.setBidder(bidder);
        newBid.setBidAmount(bidAmount);
        newBid.setStatus(Bid.BidStatus.WINNING);
        newBid.setBidDate(new Date());

        // Update auction with new highest bid
        auction.setCurrentHighestBid(bidAmount);
        auction.setCurrentWinner(bidder);

        // Check for auto-extension if bid placed near end time
        if (auction.getAutoExtendOnLateBid()) {
            long timeRemaining = auction.getTimeRemainingMillis();
            long extendThreshold = auction.getExtensionTimeMinutes() * 60 * 1000; // Convert to milliseconds
            
            if (timeRemaining < extendThreshold && timeRemaining > 0) {
                // Extend auction by extension time
                Date newEndTime = new Date(auction.getEndTime().getTime() + 
                    (auction.getExtensionTimeMinutes() * 60 * 1000));
                auction.setEndTime(newEndTime);
            }
        }

        // Save bid and updated auction
        Bid savedBid = bidRepository.save(newBid);
        auctionRepository.save(auction);

        // Send notification emails (async)
        try {
            // Notify the previous highest bidder (if any)
            if (auction.getCurrentWinner() != null && !auction.getCurrentWinner().equals(bidder)) {
                emailService.sendBidOutbidNotification(
                    auction.getCurrentWinner().getUCusMail(),
                    item.getIName(),
                    bidAmount
                );
            }

            // Notify the seller about new bid
            emailService.sendNewBidNotification(
                item.getUser().getUCusMail(),
                item.getIName(),
                bidder.getUName(),
                bidAmount
            );
        } catch (Exception e) {
            // Don't fail the bid if email fails
            System.err.println("Failed to send bid notification emails: " + e.getMessage());
        }

        return savedBid;
    }

    /**
     * Get all bids for an item
     */
    public List<Bid> getBidsForItem(Long itemId) {
        Item item = itemRepository.findById(itemId)
            .orElseThrow(() -> new RuntimeException("Item not found"));
        return bidRepository.findByItemOrderByBidDateDesc(item);
    }

    /**
     * Get user's bidding history
     */
    public List<Bid> getUserBids(String userEmail) {
        User user = userRepository.findByUCusMail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return bidRepository.findByBidderOrderByBidDateDesc(user);
    }

    /**
     * Get user's winning bids
     */
    public List<Bid> getUserWinningBids(String userEmail) {
        User user = userRepository.findByUCusMail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return bidRepository.findByBidderAndStatusOrderByBidDateDesc(user, Bid.BidStatus.WINNING);
    }

    /**
     * Check if user can bid on item
     */
    public boolean canUserBid(Long itemId, String userEmail) {
        try {
            Item item = itemRepository.findById(itemId).orElse(null);
            User user = userRepository.findByUCusMail(userEmail).orElse(null);
            
            if (item == null || user == null) {
                return false;
            }

            // Can't bid on own item
            if (item.getUser().getUserId().equals(user.getUserId())) {
                return false;
            }

            // Check if bidding is enabled
            if (!Boolean.TRUE.equals(item.getBiddingEnabled())) {
                return false;
            }

            // Check if auction exists and is active
            Optional<Auction> auction = auctionRepository.findByItem(item);
            if (auction.isEmpty() || !auction.get().isActive()) {
                return false;
            }

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get current highest bid for an item
     */
    public Optional<Bid> getCurrentHighestBid(Long itemId) {
        Item item = itemRepository.findById(itemId).orElse(null);
        if (item == null) {
            return Optional.empty();
        }
        return bidRepository.findTopByItemOrderByBidAmountDesc(item);
    }

    /**
     * Cancel a bid (only if not winning)
     */
    public void cancelBid(Long bidId, String userEmail) throws Exception {
        Bid bid = bidRepository.findById(bidId)
            .orElseThrow(() -> new Exception("Bid not found"));

        User user = userRepository.findByUCusMail(userEmail)
            .orElseThrow(() -> new Exception("User not found"));

        // Check if user owns the bid
        if (!bid.getBidder().getUserId().equals(user.getUserId())) {
            throw new Exception("You can only cancel your own bids");
        }

        // Check if bid is not winning
        if (bid.getStatus() == Bid.BidStatus.WINNING) {
            throw new Exception("Cannot cancel winning bid");
        }

        // Update bid status
        bid.setStatus(Bid.BidStatus.CANCELLED);
        bidRepository.save(bid);
    }
}