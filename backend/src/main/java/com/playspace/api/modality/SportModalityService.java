package com.playspace.api.modality;

import com.playspace.api.common.BusinessException;
import com.playspace.api.common.ConflictException;
import com.playspace.api.common.NotFoundException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SportModalityService {
    private static final Pattern WHITESPACE = Pattern.compile("\\s+", Pattern.UNICODE_CHARACTER_CLASS);
    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");
    private static final Pattern NON_CODE_CHARACTERS = Pattern.compile("[^A-Z0-9]+");
    private static final Pattern EDGE_UNDERSCORES = Pattern.compile("^_+|_+$");
    private static final Pattern CODE_INPUT = Pattern.compile("[A-Z0-9_]+");

    private final SportModalityRepository modalities;

    public SportModalityService(SportModalityRepository modalities) {
        this.modalities = modalities;
    }

    @Transactional(readOnly = true)
    public List<SportModalityResponse> list() {
        return list(false);
    }

    @Transactional(readOnly = true)
    public List<SportModalityResponse> list(boolean includeInactive) {
        var result = includeInactive
                ? modalities.findAllByOrderByNameAsc()
                : modalities.findAllByActiveTrueOrderByNameAsc();
        return result.stream().map(SportModalityResponse::from).toList();
    }

    @Transactional
    public SportModalityResponse create(SportModalityRequest request) {
        var name = cleanName(request.name());
        var normalizedName = normalizedName(name);
        var generatedCode = request.code() == null || request.code().isBlank();
        var code = generatedCode ? codeFromName(name, normalizedName) : normalizeCode(request.code());

        if (modalities.existsByNormalizedName(normalizedName)) {
            throw new ConflictException("Já existe uma modalidade equivalente cadastrada.");
        }
        if (modalities.existsByCode(code)) {
            if (!generatedCode) {
                throw new ConflictException("Já existe uma modalidade com o código " + code + ".");
            }
            code = disambiguatedCode(code, normalizedName);
            if (modalities.existsByCode(code)) {
                throw new ConflictException("Não foi possível gerar um código único para a modalidade.");
            }
        }
        validatePrice(request.defaultPrice(), code);

        try {
            return SportModalityResponse.from(modalities.saveAndFlush(
                    new SportModality(code, name, normalizedName, request.defaultPrice())
            ));
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("A modalidade já foi cadastrada por outra operação.");
        }
    }

    @Transactional
    public SportModalityResponse updateStatus(String code, boolean active) {
        var modality = required(code);
        if (!active && modality.isActive() && modalities.countByActiveTrue() <= 1) {
            throw new BusinessException("Mantenha ao menos uma modalidade ativa.");
        }
        modality.setActive(active);
        return SportModalityResponse.from(modalities.saveAndFlush(modality));
    }

    @Transactional
    public void updateConfiguration(Collection<String> enabledCodes, Map<String, BigDecimal> prices) {
        if (enabledCodes == null || enabledCodes.isEmpty()) {
            throw new BusinessException("Mantenha ao menos uma modalidade ativa.");
        }
        var normalizedEnabled = new HashSet<String>();
        for (var code : enabledCodes) {
            normalizedEnabled.add(normalizeCode(code));
        }
        if (prices == null) {
            throw new BusinessException("Informe os preços padrão das modalidades.");
        }
        var normalizedPrices = new LinkedHashMap<String, BigDecimal>();
        prices.forEach((code, price) -> {
            var normalizedCode = normalizeCode(code);
            validatePrice(price, normalizedCode);
            if (normalizedPrices.putIfAbsent(normalizedCode, price) != null) {
                throw new BusinessException("O preço da modalidade " + normalizedCode + " foi informado mais de uma vez.");
            }
        });
        var all = modalities.findAllByOrderByNameAsc();
        var knownCodes = all.stream().map(SportModality::getCode).collect(java.util.stream.Collectors.toSet());
        if (!knownCodes.containsAll(normalizedEnabled)) {
            throw new BusinessException("Uma ou mais modalidades informadas não existem no catálogo.");
        }
        if (!knownCodes.containsAll(normalizedPrices.keySet())) {
            throw new BusinessException("Um ou mais preços referenciam modalidades inexistentes no catálogo.");
        }
        for (var modality : all) {
            var active = normalizedEnabled.contains(modality.getCode());
            var price = normalizedPrices.get(modality.getCode());
            if (active && price == null) {
                throw new BusinessException("Informe o preço padrão de todas as modalidades ativas.");
            }
            if (price != null) {
                modality.setDefaultPrice(price);
            }
            modality.setActive(active);
        }
        modalities.saveAll(all);
    }

    @Transactional(readOnly = true)
    public SportModality requireActive(String code) {
        var modality = required(code);
        if (!modality.isActive()) {
            throw new BusinessException("A modalidade " + modality.getName() + " está inativa.");
        }
        return modality;
    }

    @Transactional(readOnly = true)
    public List<SportModality> requireAll(Collection<String> codes) {
        if (codes == null) {
            throw new BusinessException("Informe as modalidades.");
        }
        var unique = new LinkedHashMap<String, SportModality>();
        for (var code : codes) {
            var modality = requireActive(code);
            unique.putIfAbsent(modality.getCode(), modality);
        }
        return List.copyOf(unique.values());
    }

    @Transactional(readOnly = true)
    public String displayName(String code) {
        return required(code).getName();
    }

    @Transactional(readOnly = true)
    public String resolveCode(String value) {
        if (value == null || value.isBlank()) {
            throw new BusinessException("Informe a modalidade.");
        }
        var clean = Normalizer.normalize(value, Normalizer.Form.NFKC).trim();
        var possibleCode = clean.toUpperCase(Locale.ROOT);
        if (CODE_INPUT.matcher(possibleCode).matches()) {
            var byCode = modalities.findByCode(normalizeCode(possibleCode));
            if (byCode.isPresent()) {
                return byCode.get().getCode();
            }
        }
        return modalities.findByNormalizedName(normalizedName(clean))
                .map(SportModality::getCode)
                .orElseThrow(() -> new NotFoundException("Modalidade não encontrada."));
    }

    @Transactional(readOnly = true)
    public Map<String, BigDecimal> pricesByCode() {
        var result = new LinkedHashMap<String, BigDecimal>();
        modalities.findAllByOrderByNameAsc().forEach(item -> result.put(item.getCode(), item.getDefaultPrice()));
        return result;
    }

    @Transactional(readOnly = true)
    public Set<String> activeCodes() {
        return modalities.findAllByActiveTrueOrderByNameAsc().stream()
                .map(SportModality::getCode)
                .collect(java.util.stream.Collectors.toCollection(java.util.LinkedHashSet::new));
    }

    public String normalizeCode(String value) {
        if (value == null || value.isBlank()) {
            throw new BusinessException("Informe o código da modalidade.");
        }
        var code = asciiCode(value);
        if (code.length() < 2 || code.length() > 40) {
            throw new BusinessException("O código da modalidade deve ter entre 2 e 40 caracteres.");
        }
        return code;
    }

    public String normalizedName(String value) {
        var clean = cleanName(value);
        var withoutMarks = DIACRITICS.matcher(Normalizer.normalize(clean, Normalizer.Form.NFD)).replaceAll("");
        return WHITESPACE.matcher(withoutMarks.toLowerCase(Locale.ROOT)).replaceAll(" ").trim();
    }

    private SportModality required(String code) {
        var normalizedCode = normalizeCode(code);
        return modalities.findByCode(normalizedCode)
                .orElseThrow(() -> new NotFoundException("Modalidade não encontrada."));
    }

    private String cleanName(String value) {
        if (value == null) {
            throw new BusinessException("Informe o nome da modalidade.");
        }
        var clean = WHITESPACE.matcher(Normalizer.normalize(value, Normalizer.Form.NFKC)).replaceAll(" ").trim();
        if (clean.length() < 2 || clean.length() > 80) {
            throw new BusinessException("O nome da modalidade deve ter entre 2 e 80 caracteres.");
        }
        if (clean.codePoints().anyMatch(Character::isISOControl)) {
            throw new BusinessException("O nome da modalidade contém caracteres inválidos.");
        }
        if (clean.codePoints().noneMatch(Character::isLetterOrDigit)) {
            throw new BusinessException("O nome da modalidade deve conter ao menos uma letra ou número.");
        }
        return clean;
    }

    private void validatePrice(BigDecimal price, String code) {
        if (price == null || price.signum() < 0 || price.scale() > 2 || price.precision() - price.scale() > 8) {
            throw new BusinessException("Preço padrão inválido para a modalidade " + code + ".");
        }
    }

    private String codeFromName(String name, String normalizedName) {
        var baseCode = asciiCode(name);
        return baseCode.length() >= 2 && baseCode.length() <= 40
                ? baseCode
                : disambiguatedCode(baseCode, normalizedName);
    }

    private String asciiCode(String value) {
        var ascii = DIACRITICS.matcher(Normalizer.normalize(value, Normalizer.Form.NFD)).replaceAll("");
        return EDGE_UNDERSCORES.matcher(
                NON_CODE_CHARACTERS.matcher(ascii.toUpperCase(Locale.ROOT)).replaceAll("_")
        ).replaceAll("");
    }

    private String disambiguatedCode(String baseCode, String normalizedName) {
        var hash = UUID.nameUUIDFromBytes(normalizedName.getBytes(StandardCharsets.UTF_8))
                .toString().substring(0, 8).toUpperCase(Locale.ROOT);
        var suffix = "_" + hash;
        var safeBase = baseCode.length() >= 2 ? baseCode : "MODALIDADE";
        return safeBase.substring(0, Math.min(safeBase.length(), 40 - suffix.length())) + suffix;
    }
}
