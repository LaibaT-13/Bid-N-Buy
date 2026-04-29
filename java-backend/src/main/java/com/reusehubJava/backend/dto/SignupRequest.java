package com.reusehubJava.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {
    private String uName;
    private String uPhone;
    private String uCusMail;
    private String uPassword;
    private String address;
}
