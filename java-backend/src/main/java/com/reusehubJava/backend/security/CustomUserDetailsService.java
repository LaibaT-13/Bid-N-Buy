package com.reusehubJava.backend.security;

import com.reusehubJava.backend.model.User;
import com.reusehubJava.backend.repository.UserRepository;
import com.reusehubJava.backend.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AdminRepository adminRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByUCusMail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Build authorities: user's BUYER/SELLER role + ADMIN if email exists in admin table
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        if (adminRepository.existsByAEmail(user.getUCusMail())) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUCusMail(),
                user.getUPassword(),
                authorities
        );
    }
}
