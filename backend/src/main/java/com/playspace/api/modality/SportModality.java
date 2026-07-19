package com.playspace.api.modality;

import com.playspace.api.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

@Entity
@Table(
        name = "sport_modality",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_sport_modality_code", columnNames = "code"),
                @UniqueConstraint(name = "uk_sport_modality_normalized_name", columnNames = "normalized_name")
        }
)
public class SportModality extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(min = 2, max = 40)
    @Column(nullable = false, length = 40)
    private String code;

    @NotBlank
    @Size(min = 2, max = 255)
    @Column(nullable = false, length = 255)
    private String name;

    @NotBlank
    @Size(min = 2, max = 255)
    @Column(name = "normalized_name", nullable = false, length = 255)
    private String normalizedName;

    @Column(nullable = false)
    private boolean active = true;

    @NotNull
    @DecimalMin("0.00")
    @Digits(integer = 8, fraction = 2)
    @Column(name = "default_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal defaultPrice;

    protected SportModality() {
    }

    SportModality(String code, String name, String normalizedName, BigDecimal defaultPrice) {
        this.code = code;
        this.name = name;
        this.normalizedName = normalizedName;
        this.defaultPrice = defaultPrice;
        this.active = true;
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getNormalizedName() {
        return normalizedName;
    }

    public boolean isActive() {
        return active;
    }

    public BigDecimal getDefaultPrice() {
        return defaultPrice;
    }

    void setActive(boolean active) {
        this.active = active;
    }

    void setDefaultPrice(BigDecimal defaultPrice) {
        this.defaultPrice = defaultPrice;
    }
}
