package com.reusehubJava.backend.repository;

import com.reusehubJava.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    
    // Method for Spring Security to find a user by their unique identifier (username/email)
    @Query("SELECT u FROM User u WHERE u.uCusMail = :email")
    Optional<User> findByUCusMail(@Param("email") String email);
    
    // Method to find user by reset OTP
    @Query("SELECT u FROM User u WHERE u.resetOtp = :otp")
    Optional<User> findByResetOtp(@Param("otp") String otp);

}
