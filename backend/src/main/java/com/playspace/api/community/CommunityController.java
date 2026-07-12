package com.playspace.api.community;

import com.playspace.api.common.NotFoundException;
import com.playspace.api.security.CurrentUserService;
import com.playspace.api.user.UserRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/community")
public class CommunityController {
    private final CommunityPostRepository posts;
    private final PartnerAdRepository partnerAds;
    private final ChampionshipRepository championships;
    private final AchievementRepository achievements;
    private final ReviewRepository reviews;
    private final UserRepository users;
    private final CurrentUserService currentUser;

    public CommunityController(
            CommunityPostRepository posts,
            PartnerAdRepository partnerAds,
            ChampionshipRepository championships,
            AchievementRepository achievements,
            ReviewRepository reviews,
            UserRepository users,
            CurrentUserService currentUser
    ) {
        this.posts = posts;
        this.partnerAds = partnerAds;
        this.championships = championships;
        this.achievements = achievements;
        this.reviews = reviews;
        this.users = users;
        this.currentUser = currentUser;
    }

    @GetMapping("/feed")
    List<CommunityPostResponse> feed() {
        return posts.findTop20ByOrderByCreatedAtDesc().stream()
                .map(CommunityPostResponse::from)
                .toList();
    }

    @PostMapping("/feed/{id}/like")
    CommunityPostResponse like(@PathVariable Long id) {
        var post = posts.findById(id).orElseThrow(() -> new NotFoundException("Publicacao nao encontrada."));
        post.setLikes(post.getLikes() + 1);
        return CommunityPostResponse.from(posts.save(post));
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
    Map<String, String> enroll(@PathVariable Long id) {
        var championship = championships.findById(id).orElseThrow(() -> new NotFoundException("Campeonato nao encontrado."));
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

    @GetMapping("/ranking")
    List<Map<String, Object>> ranking() {
        return users.findAll().stream()
                .filter(user -> user.getRole().name().equals("CLIENTE"))
                .sorted(Comparator.comparingDouble(user -> -user.getHoursOnCourt()))
                .map(user -> Map.<String, Object>of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "city", user.getCity(),
                        "favoriteModality", user.getFavoriteModality(),
                        "reservations", user.getReservationsDone(),
                        "hours", user.getHoursOnCourt(),
                        "attendanceRate", user.getAttendanceRate()
                ))
                .toList();
    }

    @PostMapping("/championships")
    @PreAuthorize("hasRole('ADMIN')")
    ChampionshipResponse createChampionship(@RequestBody Championship championship) {
        return ChampionshipResponse.from(championships.save(championship));
    }
}
