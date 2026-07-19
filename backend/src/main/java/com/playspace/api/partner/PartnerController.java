package com.playspace.api.partner;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.net.URI;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/partners")
@PreAuthorize("hasRole('CLIENTE')")
public class PartnerController {
    private final PartnerService service;

    public PartnerController(PartnerService service) {
        this.service = service;
    }

    @GetMapping("/profiles/me")
    SportsProfileResponse myProfile() {
        return service.myProfile();
    }

    @PutMapping("/profiles/me")
    SportsProfileResponse saveMyProfile(@Valid @RequestBody SportsProfileRequest request) {
        return service.saveMyProfile(request);
    }

    @GetMapping
    Page<SportsProfileResponse> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String modality,
            @RequestParam(required = false) SportsLevel level,
            @RequestParam(required = false) PartnerObjective objective,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(50) int size
    ) {
        return service.search(name, city, modality, level, objective,
                PageRequest.of(page, size, Sort.by("updatedAt").descending()));
    }

    @GetMapping("/{userId}")
    SportsProfileResponse detail(@PathVariable Long userId) {
        return service.detail(userId);
    }

    @PostMapping("/{userId}/interests")
    ResponseEntity<PartnerInterestResponse> sendInterest(
            @PathVariable Long userId,
            @Valid @RequestBody(required = false) PartnerInterestRequest request
    ) {
        var created = service.sendInterest(userId, request);
        return ResponseEntity.created(URI.create("/api/partner-interests/" + created.id())).body(created);
    }
}
