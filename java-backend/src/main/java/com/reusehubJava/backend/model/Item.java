package com.reusehubJava.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.util.Date;

@Entity
@Table(name = "item")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long itemId;

    @Column(name = "i_name")
    @JsonProperty("iName")
    private String iName;
    
    @Column(name = "description")
    @JsonProperty("description")
    private String description;
    
    @Column(name = "image")
    @JsonProperty("image")
    private String image;
    
    @Column(name = "price")
    @JsonProperty("price")
    private Double price;
    
    @Column(name = "item_condition")
    @JsonProperty("condition")
    private String condition; // like-new, good, fair, needs-fixing
    
    @Column(name = "location")
    @JsonProperty("location")
    private String location;

    @Temporal(TemporalType.TIMESTAMP)
    private Date postDate;

    @Temporal(TemporalType.TIMESTAMP)
    private Date updateDate;

    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ItemStatus status = ItemStatus.PENDING;

    @Column(nullable = false)
    private Boolean available = true; // True if item is still available for purchase

    @Column(name = "bidding_enabled")
    @JsonProperty("biddingEnabled")
    private Boolean biddingEnabled = false; // True if this item allows bidding

    @OneToOne(mappedBy = "item", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private Auction auction; // Associated auction if bidding is enabled

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approved_by",referencedColumnName = "adminId", nullable = true)
    private Admin approvedBy; // Admin who approved the item

    @Temporal(TemporalType.TIMESTAMP)
    private Date approvedDate;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason; // Reason if item was rejected

    // Relationship to User (The User who posted the item)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "u_id", nullable = false)
    private User user; // Maps to u_id in your diagram

    public enum ItemStatus {
        PENDING, APPROVED, REJECTED, SOLD, UNSOLD
    }
}
