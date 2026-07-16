package com.playspace.api.user;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final ProfileService service;

    public ProfileController(ProfileService service) {
        this.service = service;
    }

    @GetMapping
    UserResponse profile() { return service.profile(); }

    @PutMapping
    UserResponse update(@Valid @RequestBody ProfileUpdateRequest request) { return service.update(request); }

    @DeleteMapping("/avatar")
    UserResponse removeAvatar() { return service.removeAvatar(); }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void changePassword(@Valid @RequestBody ChangePasswordRequest request) { service.changePassword(request); }

    @GetMapping("/summary")
    ProfileSummaryResponse summary() { return service.summary(); }

    @GetMapping("/history")
    ProfileHistoryResponse history() { return service.history(); }

    @GetMapping("/preferences")
    PreferenceResponse preferences() { return service.preferences(); }

    @PutMapping("/preferences")
    PreferenceResponse updatePreferences(@Valid @RequestBody PreferenceRequest request) {
        return service.updatePreferences(request);
    }
}
