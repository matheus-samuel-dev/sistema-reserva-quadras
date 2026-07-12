package com.playspace.api.reservation;

import com.playspace.api.court.Modality;
import com.playspace.api.security.CurrentUserService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {
    private final ReservationRepository reservations;
    private final ReservationService service;
    private final CurrentUserService currentUser;

    public ReservationController(ReservationRepository reservations, ReservationService service, CurrentUserService currentUser) {
        this.reservations = reservations;
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    List<Reservation> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ReservationStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long courtId,
            @RequestParam(required = false) Modality modality
    ) {
        return reservations.search(search, status, date, courtId, modality);
    }

    @GetMapping("/my")
    List<Reservation> myReservations() {
        return reservations.findByClientIdOrderByDateDescStartTimeDesc(currentUser.user().getId());
    }

    @GetMapping("/week")
    @PreAuthorize("hasRole('ADMIN')")
    List<Reservation> week(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end
    ) {
        return reservations.findByDateBetweenOrderByDateAscStartTimeAsc(start, end);
    }

    @GetMapping("/availability")
    List<ReservationAvailability> availability(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end
    ) {
        return service.availability(start, end);
    }

    @PostMapping
    Reservation create(@Valid @RequestBody ReservationRequest request) {
        return service.create(request, currentUser.user());
    }

    @PutMapping("/{id}/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    Reservation updateStatus(@PathVariable Long id, @PathVariable ReservationStatus status) {
        return service.updateStatus(id, status, currentUser.user());
    }

    @PutMapping("/{id}/cancel")
    Reservation cancel(@PathVariable Long id) {
        return service.cancel(id, currentUser.user());
    }
}
