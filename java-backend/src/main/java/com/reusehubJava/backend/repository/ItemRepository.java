package com.reusehubJava.backend.repository;

import com.reusehubJava.backend.model.Item;
import com.reusehubJava.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {
    
    // Find items by status
    List<Item> findByStatus(Item.ItemStatus status);
    
    // Find items by status ordered by post date
    List<Item> findByStatusOrderByPostDateDesc(Item.ItemStatus status);
    
    // Count items by status
    Long countByStatus(Item.ItemStatus status);
    
    // Find items by user and status (for user to see their own pending items)
    List<Item> findByUserAndStatusOrderByPostDateDesc(User user, Item.ItemStatus status);
    
    // Find all items by user (for user profile)
    List<Item> findByUserOrderByPostDateDesc(User user);
    
    // Find available approved items
    List<Item> findByStatusAndAvailableOrderByPostDateDesc(Item.ItemStatus status, Boolean available);
}
