package com.playspace.api.settings;

import com.playspace.api.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalTime;

@Entity
@Table(name = "platform_settings")
public class PlatformSettings extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 160) private String companyName;
    @Column(length = 160) private String legalName;
    @Column(length = 30) private String document;
    @Column(length = 254) private String companyEmail;
    @Column(length = 30) private String companyPhone;
    @Column(length = 255) private String address;
    @Column(nullable = false, length = 60) private String timezone;
    @Column(nullable = false) private LocalTime openingTime;
    @Column(nullable = false) private LocalTime closingTime;
    @Column(nullable = false, length = 100) private String operatingDays;
    @Column(nullable = false) private int cancellationRuleHours;
    @Column(nullable = false) private int minimumReservationMinutes;
    @Column(nullable = false) private int maximumAdvanceDays;
    @Column(nullable = false) private int slotMinutes;
    @Column(nullable = false, length = 200) private String enabledModalities;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal beachTennisPrice;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal futevoleiPrice;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal societyPrice;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal tenisPrice;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal voleiPrice;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal basquetePrice;
    @Column(nullable = false) private boolean acceptPix;
    @Column(nullable = false) private boolean acceptCard;
    @Column(nullable = false) private boolean acceptCash;
    @Column(length = 254) private String pixKey;
    @Column(nullable = false) private boolean emailNotifications;
    @Column(nullable = false) private boolean browserNotifications;
    @Column(nullable = false) private int reservationReminderHours;
    @Column(nullable = false, length = 20) private String primaryColor;
    @Column(length = 255) private String logoUrl;
    @Column(nullable = false, length = 20) private String defaultTheme;
    @Column(nullable = false) private int minimumPasswordLength;
    @Column(nullable = false) private int sessionMinutes;
    @Column(nullable = false) private boolean requireStrongPassword;
    @Column(nullable = false) private boolean publicRegistrationEnabled;

    public Long getId() { return id; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getLegalName() { return legalName; }
    public void setLegalName(String legalName) { this.legalName = legalName; }
    public String getDocument() { return document; }
    public void setDocument(String document) { this.document = document; }
    public String getCompanyEmail() { return companyEmail; }
    public void setCompanyEmail(String companyEmail) { this.companyEmail = companyEmail; }
    public String getCompanyPhone() { return companyPhone; }
    public void setCompanyPhone(String companyPhone) { this.companyPhone = companyPhone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
    public LocalTime getOpeningTime() { return openingTime; }
    public void setOpeningTime(LocalTime openingTime) { this.openingTime = openingTime; }
    public LocalTime getClosingTime() { return closingTime; }
    public void setClosingTime(LocalTime closingTime) { this.closingTime = closingTime; }
    public String getOperatingDays() { return operatingDays; }
    public void setOperatingDays(String operatingDays) { this.operatingDays = operatingDays; }
    public int getCancellationRuleHours() { return cancellationRuleHours; }
    public void setCancellationRuleHours(int cancellationRuleHours) { this.cancellationRuleHours = cancellationRuleHours; }
    public int getMinimumReservationMinutes() { return minimumReservationMinutes; }
    public void setMinimumReservationMinutes(int minimumReservationMinutes) { this.minimumReservationMinutes = minimumReservationMinutes; }
    public int getMaximumAdvanceDays() { return maximumAdvanceDays; }
    public void setMaximumAdvanceDays(int maximumAdvanceDays) { this.maximumAdvanceDays = maximumAdvanceDays; }
    public int getSlotMinutes() { return slotMinutes; }
    public void setSlotMinutes(int slotMinutes) { this.slotMinutes = slotMinutes; }
    public String getEnabledModalities() { return enabledModalities; }
    public void setEnabledModalities(String enabledModalities) { this.enabledModalities = enabledModalities; }
    public BigDecimal getBeachTennisPrice() { return beachTennisPrice; }
    public void setBeachTennisPrice(BigDecimal value) { this.beachTennisPrice = value; }
    public BigDecimal getFutevoleiPrice() { return futevoleiPrice; }
    public void setFutevoleiPrice(BigDecimal value) { this.futevoleiPrice = value; }
    public BigDecimal getSocietyPrice() { return societyPrice; }
    public void setSocietyPrice(BigDecimal value) { this.societyPrice = value; }
    public BigDecimal getTenisPrice() { return tenisPrice; }
    public void setTenisPrice(BigDecimal value) { this.tenisPrice = value; }
    public BigDecimal getVoleiPrice() { return voleiPrice; }
    public void setVoleiPrice(BigDecimal value) { this.voleiPrice = value; }
    public BigDecimal getBasquetePrice() { return basquetePrice; }
    public void setBasquetePrice(BigDecimal value) { this.basquetePrice = value; }
    public boolean isAcceptPix() { return acceptPix; }
    public void setAcceptPix(boolean acceptPix) { this.acceptPix = acceptPix; }
    public boolean isAcceptCard() { return acceptCard; }
    public void setAcceptCard(boolean acceptCard) { this.acceptCard = acceptCard; }
    public boolean isAcceptCash() { return acceptCash; }
    public void setAcceptCash(boolean acceptCash) { this.acceptCash = acceptCash; }
    public String getPixKey() { return pixKey; }
    public void setPixKey(String pixKey) { this.pixKey = pixKey; }
    public boolean isEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(boolean emailNotifications) { this.emailNotifications = emailNotifications; }
    public boolean isBrowserNotifications() { return browserNotifications; }
    public void setBrowserNotifications(boolean browserNotifications) { this.browserNotifications = browserNotifications; }
    public int getReservationReminderHours() { return reservationReminderHours; }
    public void setReservationReminderHours(int reservationReminderHours) { this.reservationReminderHours = reservationReminderHours; }
    public String getPrimaryColor() { return primaryColor; }
    public void setPrimaryColor(String primaryColor) { this.primaryColor = primaryColor; }
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    public String getDefaultTheme() { return defaultTheme; }
    public void setDefaultTheme(String defaultTheme) { this.defaultTheme = defaultTheme; }
    public int getMinimumPasswordLength() { return minimumPasswordLength; }
    public void setMinimumPasswordLength(int minimumPasswordLength) { this.minimumPasswordLength = minimumPasswordLength; }
    public int getSessionMinutes() { return sessionMinutes; }
    public void setSessionMinutes(int sessionMinutes) { this.sessionMinutes = sessionMinutes; }
    public boolean isRequireStrongPassword() { return requireStrongPassword; }
    public void setRequireStrongPassword(boolean requireStrongPassword) { this.requireStrongPassword = requireStrongPassword; }
    public boolean isPublicRegistrationEnabled() { return publicRegistrationEnabled; }
    public void setPublicRegistrationEnabled(boolean publicRegistrationEnabled) { this.publicRegistrationEnabled = publicRegistrationEnabled; }
}
