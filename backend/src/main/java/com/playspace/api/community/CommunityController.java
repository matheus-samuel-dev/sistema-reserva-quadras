package com.playspace.api.community;

import com.playspace.api.common.NotFoundException;
import com.playspace.api.security.CurrentUserService;
import com.playspace.api.modality.SportModalityService;
import com.playspace.api.reservation.ReservationRepository;
import com.playspace.api.reservation.ReservationStatus;
import com.playspace.api.user.UserRepository;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/community")
public class CommunityController {
    private final PartnerAdRepository partnerAds;
    private final ChampionshipRepository championships;
    private final AchievementRepository achievements;
    private final ReviewRepository reviews;
    private final ReviewService reviewService;
    private final UserRepository users;
    private final CurrentUserService currentUser;
    private final ReservationRepository reservations;
    private final SportModalityService modalities;

    public CommunityController(
            PartnerAdRepository partnerAds,
            ChampionshipRepository championships,
            AchievementRepository achievements,
            ReviewRepository reviews,
            ReviewService reviewService,
            UserRepository users,
            CurrentUserService currentUser,
            ReservationRepository reservations,
            SportModalityService modalities
    ) {
        this.partnerAds = partnerAds;
        this.championships = championships;
        this.achievements = achievements;
        this.reviews = reviews;
        this.reviewService = reviewService;
        this.users = users;
        this.currentUser = currentUser;
        this.reservations = reservations;
        this.modalities = modalities;
    }

    @GetMapping("/partners")
    List<PartnerAdResponse> partners() {
        return partnerAds.findTop20ByOrderByCreatedAtDesc().stream()
                .map(PartnerAdResponse::from)
                .toList();
    }

    @GetMapping("/championships")
    List<ChampionshipResponse> championshipList() {
        return championships.findTop12ByOrderByStartDateAsc().stream()
                .map(ChampionshipResponse::from)
                .toList();
    }

    @PostMapping("/championships/{id}/enroll")
    Map<String, String> enroll(@org.springframework.web.bind.annotation.PathVariable Long id) {
        var championship = championships.findById(id).orElseThrow(() -> new NotFoundException("Campeonato não encontrado."));
        return Map.of("message", currentUser.user().getName() + " inscrito em " + championship.getName() + " (demo).");
    }

    @GetMapping("/achievements/my")
    List<AchievementResponse> myAchievements() {
        return achievements.findByUserIdOrderByPercentCompleteDesc(currentUser.user().getId()).stream()
                .map(AchievementResponse::from)
                .toList();
    }

    @GetMapping("/reviews")
    List<ReviewResponse> latestReviews() {
        return reviews.findTop10ByOrderByCreatedAtDesc().stream()
                .map(ReviewResponse::from)
                .toList();
    }

    @PostMapping("/reviews")
    @PreAuthorize("hasRole('CLIENTE')")
    ReviewResponse createReview(@Valid @RequestBody ReviewRequest request) {
        return ReviewResponse.from(reviewService.create(request));
    }

    @GetMapping("/ranking")
    List<RankingResponse> ranking(
            @RequestParam(defaultValue = "MONTHLY") String period,
            @RequestParam(required = false) String modality
    ) {
        var normalizedModality = modality == null || modality.isBlank() ? null : modalities.resolveCode(modality);
        var today = LocalDate.now();
        var start = switch (period.toUpperCase()) {
            case "WEEKLY" -> today.minusDays(6);
            case "ANNUAL" -> today.withDayOfYear(1);
            default -> today.withDayOfMonth(1);
        };
        var eligibleReservations = reservations.findAll().stream()
                .filter(item -> !item.getDate().isBefore(start) && !item.getDate().isAfter(today))
                .filter(item -> item.getStatus() != ReservationStatus.CANCELADA && item.getStatus() != ReservationStatus.PENDENTE)
                .filter(item -> normalizedModality == null || item.getModality().equals(normalizedModality))
                .toList();
        return users.findAll().stream()
                .filter(user -> user.getRole().name().equals("CLIENTE"))
                .map(user -> {
                    var playerReservations = eligibleReservations.stream()
                            .filter(item -> item.getClient().getId().equals(user.getId()))
                            .toList();
                    var hours = playerReservations.stream()
                            .mapToLong(item -> java.time.Duration.between(item.getStartTime(), item.getEndTime()).toMinutes())
                            .sum() / 60.0;
                    var unlocked = achievements.findByUserIdOrderByPercentCompleteDesc(user.getId()).stream()
                            .filter(item -> item.getPercentComplete() >= 100)
                            .count();
                    var points = playerReservations.size() * 100L + Math.round(hours * 20) + unlocked * 250L;
                    return new RankingResponse(user.getId(), user.getName(), user.getCity(), user.getFavoriteModality(), playerReservations.size(), hours, user.getAttendanceRate(), points, unlocked);
                })
                .sorted(Comparator.comparingLong(RankingResponse::points).reversed().thenComparing(RankingResponse::name))
                .toList();
    }

    @PostMapping("/championships")
    @PreAuthorize("hasRole('ADMIN')")
    ChampionshipResponse createChampionship(@RequestBody Championship championship) {
        championship.setModality(modalities.requireActive(championship.getModality()).getCode());
        return ChampionshipResponse.from(championships.save(championship));
    }
}
