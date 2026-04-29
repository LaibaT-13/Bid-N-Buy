package com.reusehubJava.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendRegistrationOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Verify Your Account - Bid & Buy");
            message.setText(String.format(
                "Welcome to Bid & Buy — Your Campus Auction Platform!\n\n" +
                "To complete your registration, please verify your email address.\n\n" +
                "Your One-Time Verification Code:  %s\n\n" +
                "This code expires in 10 minutes.\n\n" +
                "If you did not register for Bid & Buy, please ignore this email.\n\n" +
                "— Bid & Buy Team\nCUET Campus Auction Platform", otp));
            mailSender.send(message);
            System.out.println("SUCCESS: Registration OTP sent to: " + toEmail);
        } catch (Exception e) {
            System.err.println("ERROR: Failed to send OTP to " + toEmail + ": " + e.getMessage());
            System.out.println("==============================================");
            System.out.println("REGISTRATION OTP (email failed - check console)");
            System.out.println("TO: " + toEmail + "  |  OTP: " + otp);
            System.out.println("==============================================");
        }
    }

    public void sendPasswordResetOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Password Reset - Bid & Buy");
            message.setText(String.format(
                "Hello,\n\n" +
                "You requested a password reset for your Bid & Buy account.\n\n" +
                "Your Password Reset Code:  %s\n\n" +
                "This code expires in 10 minutes.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "— Bid & Buy Team\nCUET Campus Auction Platform", otp));
            mailSender.send(message);
            System.out.println("SUCCESS: Password reset OTP sent to: " + toEmail);
        } catch (Exception e) {
            System.err.println("ERROR: Failed to send reset OTP to " + toEmail + ": " + e.getMessage());
            System.out.println("==============================================");
            System.out.println("PASSWORD RESET OTP (email failed - check console)");
            System.out.println("TO: " + toEmail + "  |  OTP: " + otp);
            System.out.println("==============================================");
        }
    }

    // Backward compatibility alias
    public void sendOtpEmail(String toEmail, String otp) {
        sendPasswordResetOtpEmail(toEmail, otp);
    }

    public void sendNewBidNotification(String sellerEmail, String itemName, String bidderName, Double bidAmount) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(sellerEmail);
            message.setSubject("New Bid Received - " + itemName + " | Bid & Buy");
            message.setText(String.format(
                "Hello,\n\nYou received a new bid on your item.\n\n" +
                "Item: %s\nBidder: %s\nBid Amount: BDT %.2f\n\n" +
                "Log in to Bid & Buy to view all bids.\n\n— Bid & Buy Team",
                itemName, bidderName, bidAmount));
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("ERROR: sendNewBidNotification failed: " + e.getMessage());
        }
    }

    public void sendBidOutbidNotification(String bidderEmail, String itemName, Double newBidAmount) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(bidderEmail);
            message.setSubject("You've been outbid - " + itemName + " | Bid & Buy");
            message.setText(String.format(
                "Hello,\n\nYour bid on \"%s\" has been outbid.\n\n" +
                "New Highest Bid: BDT %.2f\n\n" +
                "Visit Bid & Buy to place a higher bid before the auction ends.\n\n— Bid & Buy Team",
                itemName, newBidAmount));
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("ERROR: sendBidOutbidNotification failed: " + e.getMessage());
        }
    }

    public void sendAuctionWonNotification(String winnerEmail, String itemName, Double winningBid, String sellerEmail) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(winnerEmail);
            message.setSubject("Congratulations! You won - " + itemName + " | Bid & Buy");
            message.setText(String.format(
                "Congratulations!\n\nYou won the auction for: %s\n" +
                "Winning Bid: BDT %.2f\n\n" +
                "Contact the seller at %s to arrange payment and pickup.\n\n— Bid & Buy Team",
                itemName, winningBid, sellerEmail));
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("ERROR: sendAuctionWonNotification failed: " + e.getMessage());
        }
    }

    public void sendAuctionEndedNotification(String bidderEmail, String itemName, boolean didWin, Double finalPrice) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(bidderEmail);
            message.setSubject("Auction Ended - " + itemName + " | Bid & Buy");
            String body = didWin
                ? String.format(
                    "Congratulations! You won the auction for \"%s\".\n" +
                    "Final Price: BDT %.2f\n\n" +
                    "Contact the seller to arrange pickup.\n\n— Bid & Buy Team",
                    itemName, finalPrice)
                : String.format(
                    "The auction for \"%s\" has ended.\n" +
                    "Final Price: BDT %.2f\n\n" +
                    "Thank you for participating. Browse more items on Bid & Buy!\n\n— Bid & Buy Team",
                    itemName, finalPrice);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("ERROR: sendAuctionEndedNotification failed: " + e.getMessage());
        }
    }

    public void sendSaleNotification(String sellerEmail, String itemName, String buyerEmail,
                                     Double salePrice, boolean isBuyNow) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(sellerEmail);
            message.setSubject("Item Sold - " + itemName + " | Bid & Buy");
            message.setText(String.format(
                "Congratulations! Your item has been sold.\n\n" +
                "Item: %s\nSale Method: %s\nSale Price: BDT %.2f\nBuyer: %s\n\n" +
                "Contact the buyer to arrange pickup and payment.\n\n— Bid & Buy Team",
                itemName, isBuyNow ? "Buy It Now" : "Auction", salePrice, buyerEmail));
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("ERROR: sendSaleNotification failed: " + e.getMessage());
        }
    }

    public void sendAuctionWinnerEmail(String toEmail, String itemName, double winningBid) {
        sendAuctionWonNotification(toEmail, itemName, winningBid, "");
    }
}