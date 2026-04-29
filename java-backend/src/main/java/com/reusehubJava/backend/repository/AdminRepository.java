package com.reusehubJava.backend.repository;

import com.reusehubJava.backend.model.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {
    
    @Query("SELECT a FROM Admin a WHERE a.aEmail = :email")
    Optional<Admin> findByAEmail(@Param("email") String email);
    
    @Query("SELECT COUNT(a) > 0 FROM Admin a WHERE a.aEmail = :email")
    boolean existsByAEmail(@Param("email") String email);
}
