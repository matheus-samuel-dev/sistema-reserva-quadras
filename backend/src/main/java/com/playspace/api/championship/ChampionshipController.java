package com.playspace.api.championship;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.net.URI;
import java.time.LocalDate;
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
@RequestMapping("/api/championships")
public class ChampionshipController {
    private final ChampionshipService service;

    public ChampionshipController(ChampionshipService service) {
        this.service = service;
    }

    @GetMapping
    Page<ChampionshipResponse> list(
            @RequestParam(required = false) String modality,
            @RequestParam(required = false) ChampionshipStatus status,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(50) int size
    ) {
        return service.list(modality, status, city, fromDate,
                PageRequest.of(page, size, Sort.by("startDate").ascending()));
    }

    @GetMapping("/{id}")
    ChampionshipResponse detail(@PathVariable Long id) {
        return service.detail(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    ResponseEntity<ChampionshipResponse> create(@Valid @RequestBody ChampionshipRequest request) {
        var created = service.create(request);
        return ResponseEntity.created(URI.create("/api/championships/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    ChampionshipResponse update(@PathVariable Long id, @Valid @RequestBody ChampionshipRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    ChampionshipResponse updateStatus(@PathVariable Long id, @Valid @RequestBody ChampionshipStatusRequest request) {
        return service.updateStatus(id, request.status());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/enrollments")
    @PreAuthorize("hasRole('CLIENTE')")
    ResponseEntity<EnrollmentResponse> enroll(@PathVariable Long id) {
        var enrollment = service.enroll(id);
        return ResponseEntity.created(URI.create("/api/championships/" + id + "/enrollments/" + enrollment.id()))
                .body(enrollment);
    }

    @DeleteMapping("/{id}/enrollments/my")
    @PreAuthorize("hasRole('CLIENTE')")
    ResponseEntity<Void> cancelMyEnrollment(@PathVariable Long id) {
        service.cancelMyEnrollment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/participants")
    Page<EnrollmentResponse> participants(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return service.participants(id, PageRequest.of(page, size, Sort.by("createdAt").ascending()));
    }

    @GetMapping("/enrollments/my")
    @PreAuthorize("hasRole('CLIENTE')")
    Page<EnrollmentResponse> myEnrollments(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return service.myEnrollments(PageRequest.of(page, size));
    }
}
