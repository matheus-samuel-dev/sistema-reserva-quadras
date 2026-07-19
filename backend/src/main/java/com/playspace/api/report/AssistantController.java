package com.playspace.api.report;

import com.playspace.api.modality.SportModalityService;
import com.playspace.api.reservation.ReservationRepository;
import com.playspace.api.security.CurrentUserService;
import java.util.Comparator;
import java.util.Locale;
import java.util.Map;
import java.text.Normalizer;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AssistantController {
    private final CurrentUserService currentUser;
    private final ReservationRepository reservations;
    private final SportModalityService modalities;

    public AssistantController(CurrentUserService currentUser, ReservationRepository reservations,
            SportModalityService modalities) {
        this.currentUser = currentUser;
        this.reservations = reservations;
        this.modalities = modalities;
    }

    @PostMapping("/ask")
    Map<String, String> ask(@RequestBody Map<String, String> payload) {
        var user = currentUser.user();
        var question = Normalizer.normalize(payload.getOrDefault("question", "").toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        var myReservations = reservations.findByClientIdOrderByDateDescStartTimeDesc(user.getId());
        var favoriteModality = user.getFavoriteModality() == null
                ? "não informada"
                : modalities.displayName(user.getFavoriteModality());
        var answer = "Analisei seus dados PlaySpace: sua modalidade mais forte é " + favoriteModality
                + ", com " + user.getHoursOnCourt() + " horas em quadra e " + user.getAttendanceRate() + "% de comparecimento.";
        if (question.contains("gastei") || question.contains("gasto")) {
            answer = "Neste mês, seu gasto demo estimado é R$ 540,00. No ano, você está em R$ 4.380,00.";
        } else if (question.contains("ultima")) {
            answer = myReservations.isEmpty()
                    ? "Você ainda não possui reservas registradas."
                    : "Sua última reserva foi " + myReservations.get(0).getCode() + " na " + myReservations.get(0).getCourt().getName() + ".";
        } else if (question.contains("horario")) {
            answer = "Seu melhor horário histórico é 19:00, com maior frequência e melhor taxa de comparecimento.";
        } else if (question.contains("quadra")) {
            var countsByCourt = myReservations.stream()
                    .collect(Collectors.groupingBy(item -> item.getCourt().getId(), Collectors.counting()));
            var mostUsedCourtId = countsByCourt.entrySet().stream()
                    .max(Map.Entry.comparingByValue(Comparator.naturalOrder()))
                    .map(Map.Entry::getKey);
            var representativeReservation = mostUsedCourtId.flatMap(courtId -> myReservations.stream()
                    .filter(item -> item.getCourt().getId().equals(courtId))
                    .findFirst());
            answer = representativeReservation
                    .map(item -> "A quadra que você mais utiliza é a " + item.getCourt().getName()
                            + ", principalmente para " + modalities.displayName(item.getModality()) + ".")
                    .orElse("Você ainda não possui reservas suficientes para identificar uma quadra favorita.");
        }
        return Map.of("assistant", "PlaySpace AI", "answer", answer);
    }
}
