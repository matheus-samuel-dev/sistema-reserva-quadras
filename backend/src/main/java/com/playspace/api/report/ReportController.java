package com.playspace.api.report;

import com.playspace.api.reservation.ReservationRepository;
import com.playspace.api.reservation.ReservationStatus;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {
    private final ReservationRepository reservations;

    public ReportController(ReservationRepository reservations) {
        this.reservations = reservations;
    }

    @GetMapping
    Map<String, Object> summary() {
        var today = LocalDate.now();
        return Map.of(
                "receitaPorMes", List.of(4200, 5100, 6900, 7450, 8120, 9300),
                "ocupacaoPorQuadra", Map.of("Aurora", 82, "Pulse", 64, "Summit", 58, "Arena 4", 49),
                "reservasPorModalidade", Map.of("Beach Tennis", 42, "Society", 25, "Futevolei", 18, "Tenis", 10),
                "horariosPico", List.of("18:00", "19:00", "20:00"),
                "cancelamentos", reservations.countByStatus(ReservationStatus.CANCELADA),
                "clientesMaisAtivos", List.of("Marina Costa", "Lucas Alves", "Carlos Nunes"),
                "periodo", today.withDayOfMonth(1) + " a " + today
        );
    }

    @GetMapping("/export/pdf")
    ResponseEntity<byte[]> exportPdf() {
        var content = """
                %PDF-1.4
                1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
                2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
                3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
                4 0 obj << /Length 95 >> stream
                BT /F1 18 Tf 72 720 Td (PlaySpace - Relatorio demo de reservas, receita e ocupacao.) Tj ET
                endstream endobj
                trailer << /Root 1 0 R >>
                %%EOF
                """;
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=playspace-relatorio.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(content.getBytes(StandardCharsets.UTF_8));
    }

    @GetMapping("/export/excel")
    ResponseEntity<byte[]> exportExcel() {
        var csv = "Indicador;Valor\nReceita do mes;7450\nTaxa de ocupacao;68%\nCancelamentos;3\n";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=playspace-relatorio.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv.getBytes(StandardCharsets.UTF_8));
    }
}
