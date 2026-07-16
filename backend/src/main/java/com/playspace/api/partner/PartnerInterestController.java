package com.playspace.api.partner;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/partner-interests")
@PreAuthorize("hasRole('CLIENTE')")
public class PartnerInterestController {
    private final PartnerService service;

    public PartnerInterestController(PartnerService service) {
        this.service = service;
    }

    @GetMapping
    Page<PartnerInterestResponse> list(
            @RequestParam(defaultValue = "RECEBIDOS") InterestDirection direction,
            @RequestParam(required = false) PartnerInterestStatus status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return service.interests(direction, status,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    @PatchMapping("/{id}/accept")
    PartnerInterestResponse accept(@PathVariable Long id) {
        return service.accept(id);
    }

    @PatchMapping("/{id}/refuse")
    PartnerInterestResponse refuse(@PathVariable Long id) {
        return service.refuse(id);
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> cancel(@PathVariable Long id) {
        service.cancel(id);
        return ResponseEntity.noContent().build();
    }
}
