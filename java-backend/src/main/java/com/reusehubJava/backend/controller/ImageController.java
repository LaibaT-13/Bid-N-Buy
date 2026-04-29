package com.reusehubJava.backend.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/images")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
public class ImageController {

    private final String uploadDir = "uploads/images/";

    public ImageController() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory!", e);
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        Map<String, String> response = new HashMap<>();
        
        System.out.println("🖼️ Image upload request received");
        System.out.println("📁 File details: " + (file != null ? file.getOriginalFilename() : "null") + 
                          " | Size: " + (file != null ? file.getSize() : "0") + " bytes");
        
        if (file == null || file.isEmpty()) {
            System.out.println("❌ No file provided or file is empty");
            response.put("error", "Please select a file to upload");
            return ResponseEntity.badRequest().body(response);
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            System.out.println("❌ Invalid file type: " + contentType);
            response.put("error", "Please upload an image file");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + extension;
            System.out.println("📝 Generated filename: " + filename);

            // Save file
            Path targetLocation = Paths.get(uploadDir + filename);
            System.out.println("💾 Saving to: " + targetLocation.toAbsolutePath());
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Return the URL to access the image
            String imageUrl = "/api/images/" + filename;
            response.put("url", imageUrl);
            response.put("filename", filename);
            
            System.out.println("✅ Image uploaded successfully: " + imageUrl);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            System.out.println("❌ Error saving file: " + e.getMessage());
            e.printStackTrace();
            response.put("error", "Could not store file. Please try again!");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        System.out.println("🖼️ Image request for: " + filename);
        
        try {
            Path file = Paths.get(uploadDir).resolve(filename);
            System.out.println("📁 Looking for file at: " + file.toAbsolutePath());
            
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() && resource.isReadable()) {
                System.out.println("✅ File found and readable");
                
                // Try to determine file's content type
                String contentType = Files.probeContentType(file);
                if (contentType == null) {
                    contentType = "image/jpeg"; // Default to JPEG for images
                }
                System.out.println("📄 Content type: " + contentType);

                return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
            } else {
                System.out.println("❌ File not found or not readable: " + filename);
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            System.out.println("❌ Malformed URL for file: " + filename);
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            System.out.println("❌ IO error serving file: " + filename + " - " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}