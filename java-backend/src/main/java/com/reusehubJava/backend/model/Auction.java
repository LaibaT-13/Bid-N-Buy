package com.reusehubJava.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.util.Date;

@Entity
@Table(name = "auction")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Auction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long auctionId;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    @JsonBackReference
    private Item item;

    @Column(name = "starting_bid", nullable = false)
    @JsonProperty("startingBid")
    private Double startingBid;

    @Column(name = "current_highest_bid")
    @JsonProperty("currentHighestBid")
    private Double currentHighestBid;

    @Column(name = "minimum_increment", nullable = false)
    @JsonProperty("minimumIncrement")
    private Double minimumIncrement;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "start_time")
    private Date startTime;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "end_time", nullable = false)
    private Date endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuctionStatus status = AuctionStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "current_winner_id")
    private User currentWinner;

    @Column(name = "reserve_price")
    @JsonProperty("reservePrice")
    private Double reservePrice; // Minimum price the seller will accept

    @Column(name = "auto_extend_on_late_bid")
    @JsonProperty("autoExtendOnLateBid")
    private Boolean autoExtendOnLateBid = false; // Extend auction if bid placed in last minutes

    @Column(name = "extension_time_minutes")
    @JsonProperty("extensionTimeMinutes")
    private Integer extensionTimeMinutes = 5; // How long to extend

    @Column(name = "buy_now_price")
    @JsonProperty("buyNowPrice")
    private Double buyNowPrice; // Optional "Buy It Now" price

    @Column(name = "allow_buy_now")
    @JsonProperty("allowBuyNow")
    private Boolean allowBuyNow = true; // Whether to allow immediate purchase

    // Bids are fetched through BidService when needed

    public enum AuctionStatus {
        SCHEDULED, ACTIVE, ENDED, CANCELLED, SOLD
    }

    @PrePersist
    protected void onCreate() {
        if (startTime == null) {
            startTime = new Date();
        }
        if (status == null) {
            status = AuctionStatus.ACTIVE;
        }
        currentHighestBid = startingBid;
    }

    public boolean isActive() {
        Date now = new Date();
        return status == AuctionStatus.ACTIVE && 
               now.after(startTime) && 
               now.before(endTime);
    }

    public boolean hasEnded() {
        Date now = new Date();
        return status == AuctionStatus.ENDED || 
               status == AuctionStatus.SOLD ||
               now.after(endTime);
    }

    public long getTimeRemainingMillis() {
        if (hasEnded()) {
            return 0;
        }
        Date now = new Date();
        return endTime.getTime() - now.getTime();
    }

    public boolean canAcceptBid(Double bidAmount) {
        if (!isActive()) {
            return false;
        }
        
        if (currentHighestBid == null) {
            return bidAmount >= startingBid;
        }
        
        return bidAmount >= (currentHighestBid + minimumIncrement);
    }
}