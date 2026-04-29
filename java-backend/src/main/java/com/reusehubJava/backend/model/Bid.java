package com.reusehubJava.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Date;

@Entity
@Table(name = "bid")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bidId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bidder_id", nullable = false)
    private User bidder;

    @Column(name = "bid_amount", nullable = false)
    @JsonProperty("bidAmount")
    private Double bidAmount;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "bid_date")
    private Date bidDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BidStatus status = BidStatus.ACTIVE;

    @Column(name = "is_auto_bid")
    @JsonProperty("isAutoBid")
    private Boolean isAutoBid = false;

    @Column(name = "max_auto_bid_amount")
    @JsonProperty("maxAutoBidAmount")
    private Double maxAutoBidAmount;

    public enum BidStatus {
        ACTIVE, OUTBID, WINNING, WON, CANCELLED
    }

    @PrePersist
    protected void onCreate() {
        bidDate = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        // Additional logic for bid updates if needed
    }
}