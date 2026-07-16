package com.playspace.api.security;

import jakarta.validation.Valid;
import com.playspace.api.user.PublicRegistrationRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final CurrentUserService currentUser;

    public AuthController(AuthService authService, CurrentUserService currentUser) {
        this.authService = authService;
        this.currentUser = currentUser;
    }

    @PostMapping("/login")
    AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/register")
    AuthResponse register(@Valid @RequestBody PublicRegistrationRequest request) {
        return authService.register(request);
    }

    @GetMapping("/me")
    AuthResponse me() {
        return new AuthResponse(null, com.playspace.api.user.UserResponse.from(currentUser.user()));
    }
}
