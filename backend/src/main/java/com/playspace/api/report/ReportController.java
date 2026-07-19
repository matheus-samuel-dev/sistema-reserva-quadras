package com.playspace.api.report;

import com.playspace.api.reservation.ReservationRepository;
import com.playspace.api.reservation.ReservationStatus;
import com.playspace.api.modality.SportModalityService;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.LinkedHashMap;
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
    private final SportModalityService modalities;

    public ReportController(ReservationRepository reservations, SportModalityService modalities) {
        this.reservations = reservations;
        this.modalities = modalities;
    }

    @GetMapping
    Map<String, Object> summary() {
        var today = LocalDate.now();
        return Map.of(
                "receitaPorMes", List.of(4200, 5100, 6900, 7450, 8120, 9300),
                "ocupacaoPorQuadra", Map.of("Aurora", 82, "Pulse", 64, "Summit", 58, "Arena 4", 49),
                "reservasPorModalidade", reservationsByModality(),
                "horariosPico", List.of("18:00", "19:00", "20:00"),
                "cancelamentos", reservations.countByStatus(ReservationStatus.CANCELADA),
                "clientesMaisAtivos", List.of("Marina Costa", "Lucas Alves", "Carlos Nunes"),
                "periodo", today.withDayOfMonth(1) + " a " + today
        );
    }

    @GetMapping("/export/pdf")
    ResponseEntity<byte[]> exportPdf() {
        var lines = new ArrayList<String>();
        lines.add("PlaySpace - Reservas por modalidade");
        reservationsByModality().forEach((name, count) -> lines.add(name + ": " + count + " reserva(s)"));
        lines.add("Cancelamentos: " + reservations.countByStatus(ReservationStatus.CANCELADA));

        var streamBuilder = new StringBuilder("BT\n/F1 18 Tf\n72 740 Td\n");
        for (int index = 0; index < lines.size(); index++) {
            if (index > 0) {
                streamBuilder.append("/F1 12 Tf\n0 -22 Td\n");
            }
            streamBuilder.append('(').append(escapePdfText(lines.get(index))).append(") Tj\n");
        }
        streamBuilder.append("ET");
        var stream = streamBuilder.toString();
        var content = """
                %%PDF-1.4
                1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
                2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
                3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj
                4 0 obj << /Length %d >> stream
                %s
                endstream endobj
                5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> endobj
                trailer << /Root 1 0 R >>
                %%%%EOF
                """.formatted(stream.getBytes(StandardCharsets.ISO_8859_1).length, stream);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=playspace-relatorio.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(content.getBytes(StandardCharsets.ISO_8859_1));
    }

    @GetMapping("/export/excel")
    ResponseEntity<byte[]> exportExcel() {
        var csv = new StringBuilder("Modalidade;Reservas\n");
        reservationsByModality().forEach((name, count) -> csv.append(name).append(';').append(count).append('\n'));
        csv.append("Cancelamentos;").append(reservations.countByStatus(ReservationStatus.CANCELADA)).append('\n');
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=playspace-relatorio.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv.toString().getBytes(StandardCharsets.UTF_8));
    }

    private Map<String, Long> reservationsByModality() {
        var result = new LinkedHashMap<String, Long>();
        reservations.countReservationsByModality().forEach(row ->
                result.put(modalities.displayName(String.valueOf(row[0])), ((Number) row[1]).longValue()));
        return result;
    }

    private String escapePdfText(String value) {
        var encodable = new String(value.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.ISO_8859_1);
        return encodable.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)");
    }
}
