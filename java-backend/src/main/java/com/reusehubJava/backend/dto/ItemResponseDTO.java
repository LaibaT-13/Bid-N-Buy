package com.reusehubJava.backend.dto;

import com.reusehubJava.backend.model.Item;
import java.util.Date;

public class ItemResponseDTO {
    private Long itemId;
    private String iName;
    private String description;
    private Double price;
    private String category;
    private String condition;
    private String location;
    private String image;
    private Date postDate;
    private Date updateDate;
    private Boolean available;
    private String status;
    private String rejectionReason;
    private String approvedBy;
    private Date approvedDate;
    
    // User details flattened
    private Long userId;
    private String userName;
    private String userEmail;
    private String userPhone;
    private String userRole;
    private String userStatus;
    private String userAddress;
    
    public ItemResponseDTO() {}
    
    public ItemResponseDTO(Item item) {
        this.itemId = item.getItemId();
        this.iName = item.getIName();
        this.description = item.getDescription();
        this.price = item.getPrice();
        this.category = item.getCategory();
        this.condition = item.getCondition();
        this.location = item.getLocation();
        this.image = item.getImage();
        this.postDate = item.getPostDate();
        this.updateDate = item.getUpdateDate();
        this.available = item.getAvailable();
        this.status = item.getStatus() != null ? item.getStatus().toString() : null;
        this.rejectionReason = item.getRejectionReason();
        this.approvedBy = item.getApprovedBy() != null ? item.getApprovedBy().getAName() : null;
        this.approvedDate = item.getApprovedDate();
        
        // Safely get user details
        if (item.getUser() != null) {
            this.userId = item.getUser().getUserId();
            this.userName = item.getUser().getUName();
            this.userEmail = item.getUser().getUCusMail();
            this.userPhone = item.getUser().getUPhone();
            this.userRole = item.getUser().getRole() != null ? item.getUser().getRole().toString() : null;
            this.userStatus = item.getUser().getStatus() != null ? item.getUser().getStatus().toString() : null;
            this.userAddress = item.getUser().getAddress();
        }
    }
    
    // Getters and Setters
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    
    public String getIName() { return iName; }
    public void setIName(String iName) { this.iName = iName; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
    
    public Date getPostDate() { return postDate; }
    public void setPostDate(Date postDate) { this.postDate = postDate; }
    
    public Date getUpdateDate() { return updateDate; }
    public void setUpdateDate(Date updateDate) { this.updateDate = updateDate; }
    
    public Boolean getAvailable() { return available; }
    public void setAvailable(Boolean available) { this.available = available; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    
    public Date getApprovedDate() { return approvedDate; }
    public void setApprovedDate(Date approvedDate) { this.approvedDate = approvedDate; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    
    public String getUserPhone() { return userPhone; }
    public void setUserPhone(String userPhone) { this.userPhone = userPhone; }
    
    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }
    
    public String getUserStatus() { return userStatus; }
    public void setUserStatus(String userStatus) { this.userStatus = userStatus; }
    
    public String getUserAddress() { return userAddress; }
    public void setUserAddress(String userAddress) { this.userAddress = userAddress; }
}