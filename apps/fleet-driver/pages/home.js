// ========================================
// DAGOOS FLEET DRIVER - DASHBOARD HOME
// ========================================

var currentDriver = null;
var currentVehicle = null;
var currentOrg = null;
var expenses = [];

var estBloque = false;
var isOnline = navigator.onLine;
var refreshInterval = null;
var notificationInterval = null;

var organizationTarifs = null;
var courseTypes = [
    { value: 'course', label: 'Course normale' },
    { value: 'adyVarotra', label: 'Ady Varotra' },
    { value: 'locationJournalier', label: 'Location journalière' }
];

var vehicleTypeLabels = {
    'MOTO': 'Taxi Moto',
    'VOITURE': 'Taxi Voiture',
    'BUS': 'Bus',
    'MINIVAN': 'Mini Van',
    'TRICYCLE': 'Tricycle (Bajaj)'
};


// ========================================
// UTILITAIRES
// ========================================

function getDriverUser() {
    try {
        return JSON.parse(
            localStorage.getItem('dagoo_driver_user') || '{}'
        );
    } catch (e) {
        return {};
    }
}

function getDriverToken() {
    return localStorage.getItem('dagoo_driver_token') || '';
}

function formatAmount(value) {
    var amount = Number(value) || 0;
    return Math.round(amount).toLocaleString('fr-FR') + ' Ar';
}

function formatNumber(value) {
    return Math.round(Number(value) || 0).toLocaleString('fr-FR');
}

function setText(id, value) {
    var el = document.getElementById(id);
    if (el) {
        el.textContent = value;
    }
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

function getWeekStartString() {
    var now = new Date();
    var day = now.getDay();

    // Lundi = 0
    var diff = day === 0 ? 6 : day - 1;

    var monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - diff);

    return monday.toISOString().split('T')[0];
}

function isDateInCurrentWeek(dateValue) {
    if (!dateValue) return false;

    var dateString = String(dateValue).split('T')[0];
    var weekStart = getWeekStartString();
    var today = getTodayString();

    return dateString >= weekStart && dateString <= today;
}

function getApiUrl() {
    return (
        typeof DAGOOS_CONFIG !== 'undefined' &&
        DAGOOS_CONFIG.apiUrl
    )
        ? DAGOOS_CONFIG.apiUrl
        : '';
}


// ========================================
// TARIFS
// ========================================

function parseOrganizationTarifs(data) {
    if (!data) return null;

    var result = data;

    if (typeof result === 'string') {
        try {
            result = JSON.parse(result);
        } catch (e) {
            return null;
        }
    }

    return result;
}

// Types de véhicules pour lesquels le tarif est au forfait (un seul prix
// fixe par trajet), par opposition à moto/voiture qui sont tarifés au
// (prixBase + prixKm). Doit rester aligné avec admin-next
// (src/app/flotte/settings/page.tsx, FLEET_DEFAULT_TARIFS).
var FLAT_FARE_VEHICLE_TYPES = ['BUS', 'MINIVAN', 'TRICYCLE'];

// Mapping enum → clés tarifaires (pour cohérence avec admin settings)
var VEHICLE_TARIF_KEY_MAP = {
    MOTO: 'moto',
    VOITURE: 'voiture',
    BUS: 'bus',
    MINIVAN: 'minivan',
    TRICYCLE: 'tricycle'
};

function getVehiculeTarifs(tarifs) {
    if (!tarifs) return null;

    var vehicleTarifs = tarifs.vehiculeTarifs;

    if (typeof vehicleTarifs === 'string') {
        try {
            vehicleTarifs = JSON.parse(vehicleTarifs);
        } catch (e) {
            return null;
        }
    }

    return (vehicleTarifs && typeof vehicleTarifs === 'object') ? vehicleTarifs : null;
}

// Construit les options de type de course (Course normale / Ady Varotra /
// Location) à partir de la grille tarifaire réellement configurée pour LE
// TYPE DU VÉHICULE du chauffeur connecté (moto, voiture, bus, minivan,
// tricycle) — pas à partir des types de véhicules eux-mêmes.
function loadCourseTypesFromTarifs(tarifs, vehicleType) {
    var fallback = [
        { value: 'course', label: 'Course normale' },
        { value: 'adyVarotra', label: 'Ady Varotra' },
        { value: 'locationJournalier', label: 'Location journalière' }
    ];

    var vehiculeTarifs = getVehiculeTarifs(tarifs);
    var type = vehicleType || (currentVehicle && currentVehicle.type) || 'VOITURE';

    // Mapper l'enum VehicleType vers les clés tarifaires minuscules
    var typeTarifMap = {
        MOTO: 'moto',
        VOITURE: 'voiture',
        BUS: 'bus',
        MINIVAN: 'minivan',
        TRICYCLE: 'tricycle'
    };
    var cleConfig = typeTarifMap[type] || String(type).toLowerCase();

    var config = vehiculeTarifs ? vehiculeTarifs[cleConfig] : null;

    if (!config || typeof config !== 'object') {
        courseTypes = fallback;
        return;
    }

    if (FLAT_FARE_VEHICLE_TYPES.indexOf(type) !== -1) {
        // Bus / Mini Van / Tricycle : un tarif fixe, et une location
        // spéciale seulement si elle a été activée dans les paramètres.
        var options = [{ value: 'tarifFixe', label: 'Trajet (tarif fixe)' }];
        if (
            config.locationSpeciale &&
            config.locationSpeciale.active === true
        ) {
            options.push({
                value: 'locationSpeciale',
                label: 'Location spéciale'
            });
        }
        courseTypes = options;
        return;
    }

    // Moto / Voiture : course normale, Ady Varotra, location journalière.
    var options = [];
    if (config.courseNormale) options.push({ value: 'courseNormale', label: 'Course normale' });
    if (config.adyVarotra) options.push({ value: 'adyVarotra', label: 'Ady Varotra' });
    if (config.locationJournalier) options.push({ value: 'locationJournalier', label: 'Location journalière' });

    courseTypes = options.length ? options : fallback;
}

async function loadOrganizationTarifs() {
    try {
        if (!currentDriver || !currentDriver.organizationId) {
            return;
        }

        var data = await apiGet(
            '/tarifs/' + currentDriver.organizationId
        );

        organizationTarifs = parseOrganizationTarifs(data);
    } catch (e) {
        console.warn('Tarifs organisation indisponibles:', e);
    }
}

// À appeler une fois que currentVehicle est connu (après le chargement du
// véhicule), pour construire les options de course adaptées à SA
// catégorie de véhicule.
function refreshCourseTypesForCurrentVehicle() {
    loadCourseTypesFromTarifs(organizationTarifs, currentVehicle && currentVehicle.type);
}

// Renvoie la configuration tarifaire (prixBase/prixKm/prixJour/prixTrajet)
// pour un mode de course donné (ex: 'courseNormale', 'adyVarotra',
// 'locationJournalier', 'tarifFixe', 'locationSpeciale'), pour le véhicule
// actuellement assigné au chauffeur.
function getVehicleTarifConfig(courseMode) {
    if (!organizationTarifs) return null;

    var vehicleType =
        currentVehicle?.type ||
        'VOITURE';

    var vehicleTypeMap = {
        MOTO: 'moto',
        VOITURE: 'voiture',
        BUS: 'bus',
        MINIVAN: 'minivan',
        TRICYCLE: 'tricycle'
    };

    var vehicleKey =
        vehicleTypeMap[vehicleType] ||
        String(vehicleType).toLowerCase();

    var vehiculeTarifs =
        getVehiculeTarifs(organizationTarifs);

    if (!vehiculeTarifs) {
        return organizationTarifs;
    }

    var vehicleConfig =
        vehiculeTarifs[vehicleKey];

    if (!vehicleConfig) {
        return organizationTarifs;
    }

    if (courseMode === 'tarifFixe') {
        return vehicleConfig.tarifFixe || null;
    }

    if (courseMode === 'locationSpeciale') {
        return vehicleConfig.locationSpeciale || null;
    }

    if (courseMode === 'locationJournalier') {
        return vehicleConfig.locationJournalier || null;
    }

    if (courseMode === 'adyVarotra') {
        return vehicleConfig.adyVarotra || null;
    }

    if (courseMode === 'courseNormale') {
        return vehicleConfig.courseNormale || null;
    }

    return vehicleConfig;
}

function getTarifValue(config, keys) {
    if (!config || typeof config !== 'object') {
        return 0;
    }

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];

        if (
            config[key] !== undefined &&
            config[key] !== null &&
            !isNaN(Number(config[key]))
        ) {
            return Number(config[key]);
        }
    }

    return 0;
}

function getBaseTarif(courseMode) {
    var config = getVehicleTarifConfig(courseMode);

    return getTarifValue(config, [
        'prixBase',
        'prixTrajet',
        'base',
        'basePrice',
        'prix'
    ]);
}

function getKmTarif(courseMode) {
    var config = getVehicleTarifConfig(courseMode);

    return getTarifValue(config, [
        'prixKm',
        'km',
        'pricePerKm',
        'prixParKm'
    ]);
}

function getLocationTarif(courseMode) {
    var config = getVehicleTarifConfig(courseMode);

    return getTarifValue(config, [
        'prixJour',
        'location',
        'locationJour',
        'locationJournalier',
        'prixLocation',
        'pricePerDay'
    ]);
}

// Commission réelle de l'organisation (configurée dans /flotte/settings),
// avec repli à 20 % si elle n'a pas pu être chargée.
function getCommissionPct() {
    if (
        organizationTarifs &&
        organizationTarifs.commissionChauffeur !== undefined &&
        organizationTarifs.commissionChauffeur !== null &&
        !isNaN(Number(organizationTarifs.commissionChauffeur))
    ) {
        return Number(organizationTarifs.commissionChauffeur);
    }
    return 20;
}


// ========================================
// INITIALISATION
// ========================================

async function init_home() {
    var main = document.getElementById('mainContent');
    var user = getDriverUser();
    var driverId = user.driverId;

    if (!driverId) {
        window.location.href = '/';
        return;
    }

    main.innerHTML =
        getHeaderLoadingHTML() +
        '<div style="padding:40px;text-align:center;color:#94A3B8;">' +
            'Chargement du tableau de bord...' +
        '</div>';

    // ------------------------------------
    // CHARGEMENT DU CHAUFFEUR
    // ------------------------------------

    try {
        currentDriver = await apiGet('/drivers/me');

        window.currentDriver = currentDriver;

        if (
            currentDriver &&
            currentDriver.organization
        ) {
            currentOrg = {
                id: currentDriver.organizationId || '',
                name: currentDriver.organization.name || 'Organisation',
                code: currentDriver.organizationCode || '',
                slug: currentDriver.organization.slug || ''
            };
        } else if (currentDriver && currentDriver.organizationId) {
            currentOrg = {
                id: currentDriver.organizationId,
                name: user.organization || 'Organisation',
                code: currentDriver.organizationCode || '',
                slug: ''
            };
        } else {
            currentOrg = {
                id: '',
                name: user.organization || 'Flotte',
                code: '',
                slug: ''
            };
        }

    } catch (e) {
        console.error('Chargement chauffeur:', e);

        currentDriver = null;

        currentOrg = {
            id: '',
            name: user.organization || 'Flotte',
            code: ''
        };
    }

    // ------------------------------------
    // CHARGEMENT TARIFS
    // ------------------------------------

    await loadOrganizationTarifs();

    // ------------------------------------
    // CHARGEMENT VEHICULE
    // ------------------------------------

    try {
        if (currentDriver && currentDriver.vehicleId) {
            var vehicles = await apiGet('/vehicles');

            if (Array.isArray(vehicles)) {
                currentVehicle = vehicles.find(function (vehicle) {
                    return vehicle.id === currentDriver.vehicleId;
                });

                window.currentVehicle = currentVehicle || null;
            }
        }
    } catch (e) {
        console.error('Chargement véhicule:', e);
        currentVehicle = null;
    }

    // Les types de course dépendent de la catégorie du véhicule
    // (moto/voiture/bus/minivan/tricycle) : on ne peut les construire
    // qu'une fois currentVehicle connu.
    refreshCourseTypesForCurrentVehicle();

    // ------------------------------------
    // CONTEXTE
    // ------------------------------------

    window.DAGOOS_DRIVER_CONTEXT = {
        orgType:
            currentDriver &&
            currentDriver.organization &&
            currentDriver.organization.type
                ? currentDriver.organization.type
                : 'FLEET_MANAGER',

        isCoop: false,

        orgName: currentOrg ? currentOrg.name : 'Flotte',

        orgSlug:
            currentDriver &&
            currentDriver.organization
                ? currentDriver.organization.slug || ''
                : ''
    };

    // ------------------------------------
    // STATUT
    // ------------------------------------

    var driverStatus =
        currentDriver && currentDriver.status
            ? currentDriver.status
            : 'OFFLINE';

    var isAvailable =
        driverStatus === 'AVAILABLE' ||
        driverStatus === 'active';

    var isOnBreak =
        driverStatus === 'ON_BREAK' ||
        driverStatus === 'pause';

    var statutPresence =
        isAvailable
            ? 'present'
            : isOnBreak
                ? 'pause'
                : 'absent';

    window.statutPresence = statutPresence;

    var statusLabel =
        isAvailable
            ? 'En service'
            : isOnBreak
                ? 'En pause'
                : 'Absent';

    var statusColor =
        isAvailable
            ? ''+ (window.FLEET_THEME ? window.FLEET_THEME.success : '#22C55E') +''
            : isOnBreak
                ? ''+ (window.FLEET_THEME ? window.FLEET_THEME.warning : '#F59E0B') +''
                : ''+ (window.FLEET_THEME ? window.FLEET_THEME.danger : '#E74C3C') +'';

    var plate =
        currentVehicle &&
        currentVehicle.plate
            ? currentVehicle.plate
            : '';

    var orgName =
        currentOrg
            ? currentOrg.name
            : (user.organization || 'Flotte');

    var logo =
        typeof DAGOOS_CONFIG !== 'undefined'
            ? DAGOOS_CONFIG.logoUrl
            : '';

    // ------------------------------------
    // HTML PRINCIPAL
    // ------------------------------------

    var typeOptions = courseTypes.map(function (item) {
        return (
            '<option value="' +
            escapeHtml(item.value) +
            '">' +
            escapeHtml(item.label) +
            '</option>'
        );
    }).join('');

    main.innerHTML =
        // HEADER
        '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : '#1E293B') +';padding:10px 14px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;border-bottom:1px solid '+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';">' +

            '<div style="display:flex;align-items:center;gap:8px;">' +

                (
                    logo
                        ? '<img src="' +
                          escapeHtml(logo) +
                          '" style="width:36px;height:36px;object-fit:contain;border-radius:8px;">'
                        : '<div style="width:36px;height:36px;border-radius:8px;background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : '#252525') +';"></div>'
                ) +

                '<div>' +

                    '<div style="font-size:14px;font-weight:700;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';">' +
                        escapeHtml(user.name || 'Chauffeur') +
                    '</div>' +

                    '<div style="font-size:10px;color:#94A3B8;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' +

                        '<span style="padding:2px 6px;border-radius:20px;font-size:9px;background:#2a2a2a;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';">' +
                            'Flotte' +
                        '</span>' +

                        '<span style="padding:2px 6px;border-radius:20px;font-size:9px;background:' +
                            statusColor +
                            ';color:#fff;">' +
                            statusLabel +
                        '</span>' +

                        (
                            plate
                                ? '<span style="padding:2px 6px;border-radius:20px;font-size:9px;background:#2a2a2a;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';">' +
                                  escapeHtml(plate) +
                                  '</span>'
                                : '<span style="padding:2px 6px;border-radius:20px;font-size:9px;background:'+ (window.FLEET_THEME ? window.FLEET_THEME.danger : '#E74C3C') +';color:#fff;">Sans véhicule</span>'
                        ) +

                        '<span style="color:#94A3B8;">' +
                            escapeHtml(user.driverCode || '') +
                        '</span>' +

                    '</div>' +
                '</div>' +
            '</div>' +

            '<div style="display:flex;gap:4px;">' +

                '<button onclick="loadPage(\'notifications\')" style="background:rgba(255,255,255,0.1);border:none;width:32px;height:32px;border-radius:50%;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';cursor:pointer;font-size:14px;position:relative;" aria-label="Notifications">🔔</button>' +
                '<button onclick="loadPage(\'profil\')" style="background:rgba(255,255,255,0.1);border:none;width:32px;height:32px;border-radius:50%;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';cursor:pointer;font-size:14px;" aria-label="Profil">📶</button>' +

                '<button onclick="logout()" style="background:rgba(239,68,68,0.15);border:none;width:32px;height:32px;border-radius:50%;color:#F87171;cursor:pointer;font-size:16px;" aria-label="Déconnexion">⏻</button>' +

            '</div>' +
        '</div>' +

        // CONTENU
        '<div style="padding:12px;max-width:500px;margin:0 auto;padding-bottom:80px;">' +

            // COURSE ACTIVE
            '<div id="courseActiveCard"></div>' +

            // COMPTE BLOQUE
            (
                estBloque
                    ? '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.danger : '#E74C3C') +';color:#fff;padding:10px;border-radius:10px;text-align:center;margin-bottom:10px;">' +
                        'Compte bloqué - Régularisez vos versements' +
                      '</div>'
                    : ''
            ) +

            // STATUT (toujours visible)
            '<div style="display:flex;gap:8px;margin-bottom:10px;">' +

                '<button onclick="changeStatus(\'present\')" style="flex:1;padding:12px 6px;background:'+ (window.FLEET_THEME ? window.FLEET_THEME.success : '#22C55E') +';color:#fff;border:none;border-radius:14px;cursor:pointer;font-weight:700;font-size:12px;" ' +
                    (estBloque ? 'disabled' : '') +
                '>' +
                    'Début' +
                '</button>' +

                '<button onclick="changeStatus(\'pause\')" style="flex:1;padding:12px 6px;background:'+ (window.FLEET_THEME ? window.FLEET_THEME.warning : '#F59E0B') +';color:#000;border:none;border-radius:14px;cursor:pointer;font-weight:700;font-size:12px;" ' +
                    (estBloque || statutPresence !== 'present' ? 'disabled' : '') +
                '>' +
                    'Pause' +
                '</button>' +

                '<button onclick="changeStatus(\'termine\')" style="flex:1;padding:12px 6px;background:'+ (window.FLEET_THEME ? window.FLEET_THEME.danger : '#E74C3C') +';color:#fff;border:none;border-radius:14px;cursor:pointer;font-weight:700;font-size:12px;" ' +
                    (
                        estBloque ||
                        statutPresence === 'absent' ||
                        statutPresence === 'termine'
                            ? 'disabled'
                            : ''
                    ) +
                '>' +
                    'Fin' +
                '</button>' +

            '</div>' +

            // STATISTIQUES JOUR
            '<div class="card" style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : '#1E293B') +';border-radius:12px;padding:14px;margin-bottom:10px;">' +

                '<h3 style="color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';margin-bottom:10px;font-size:13px;">Aujourd\'hui</h3>' +

                '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;">' +

                    '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : '#252525') +';border-radius:10px;padding:8px;">' +
                        '<div style="font-size:18px;font-weight:800;color:#fff;" id="statCoursesJour">0</div>' +
                        '<div style="font-size:9px;color:#888;">Courses</div>' +
                    '</div>' +

                    '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : '#252525') +';border-radius:10px;padding:8px;">' +
                        '<div style="font-size:18px;font-weight:800;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.success : '#22C55E') +';" id="statCAJour">0</div>' +
                        '<div style="font-size:9px;color:#888;">CA</div>' +
                    '</div>' +

                    '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : '#252525') +';border-radius:10px;padding:8px;">' +
                        '<div style="font-size:18px;font-weight:800;color:#3B82F6;" id="statCommissionJour">0</div>' +
                        '<div style="font-size:9px;color:#888;">Part chauffeur</div>' +
                    '</div>' +

                    '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : '#252525') +';border-radius:10px;padding:8px;">' +
                        '<div style="font-size:18px;font-weight:800;color:#8B5CF6;" id="statNetJour">0</div>' +
                        '<div style="font-size:9px;color:#888;">À verser</div>' +
                    '</div>' +

                '</div>' +
            '</div>' +

            // STATISTIQUES SEMAINE
            '<div class="card" style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : '#1E293B') +';border-radius:12px;padding:14px;margin-bottom:10px;">' +

                '<h3 style="color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';margin-bottom:10px;font-size:13px;">Cette semaine</h3>' +

                '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;">' +

                    '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : '#252525') +';border-radius:10px;padding:8px;">' +
                        '<div style="font-size:16px;font-weight:800;color:#fff;" id="statCoursesSem">0</div>' +
                        '<div style="font-size:9px;color:#888;">Courses</div>' +
                    '</div>' +

                    '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : '#252525') +';border-radius:10px;padding:8px;">' +
                        '<div style="font-size:16px;font-weight:800;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.success : '#22C55E') +';" id="statCASem">0</div>' +
                        '<div style="font-size:9px;color:#888;">CA</div>' +
                    '</div>' +

                    '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : '#252525') +';border-radius:10px;padding:8px;">' +
                        '<div style="font-size:16px;font-weight:800;color:#3B82F6;" id="statCommissionSem">0</div>' +
                        '<div style="font-size:9px;color:#888;">Part chauffeur</div>' +
                    '</div>' +

                    '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : '#252525') +';border-radius:10px;padding:8px;">' +
                        '<div style="font-size:16px;font-weight:800;color:#8B5CF6;" id="statNetSem">0</div>' +
                        '<div style="font-size:9px;color:#888;">À verser</div>' +
                    '</div>' +

                '</div>' +
            '</div>' +

            // NOUVELLE COURSE
            '<div class="card" style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : '#1E293B') +';border-radius:12px;padding:14px;margin-bottom:10px;">' +

                '<h3 style="color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';margin-bottom:10px;font-size:13px;">Nouvelle course</h3>' +

                '<div style="display:flex;gap:8px;margin-bottom:8px;">' +

                    '<select id="typeCourse" onchange="updateCourseForm()" style="flex:1;padding:8px;background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : '#252525') +';border:1px solid #333;border-radius:8px;color:#fff;font-size:12px;">' +
                        typeOptions +
                    '</select>' +

                '</div>' +

                '<div id="courseForm"></div>' +

                '<button onclick="enregistrerCourse()" ' +
                    (
                        estBloque ||
                        statutPresence !== 'present' ||
                        !currentVehicle
                            ? 'disabled'
                            : ''
                    ) +
                    ' style="width:100%;padding:12px;background:#F1C40F;color:#1A1A2E;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:14px;">' +
                    'Enregistrer la course' +
                '</button>' +

                '<div id="courseMsg" style="margin-top:8px;text-align:center;font-size:11px;"></div>' +

            '</div>' +

            // DEPENSES
            '<div class="card" style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : '#1E293B') +';border-radius:12px;padding:14px;margin-bottom:10px;">' +

                '<h3 style="color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';margin-bottom:10px;font-size:13px;">Dépenses du jour</h3>' +

                '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px;">' +

                    '<button onclick="addExpense(\'carburant\')" style="padding:10px 4px;background:#1A1A2E;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';border:1px solid '+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';border-radius:8px;cursor:pointer;font-size:10px;">Carburant</button>' +

                    '<button onclick="addExpense(\'entretien\')" style="padding:10px 4px;background:#1A1A2E;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';border:1px solid '+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';border-radius:8px;cursor:pointer;font-size:10px;">Entretien</button>' +

                    '<button onclick="addExpense(\'pneu\')" style="padding:10px 4px;background:#1A1A2E;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';border:1px solid '+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';border-radius:8px;cursor:pointer;font-size:10px;">Pneus</button>' +

                    '<button onclick="addExpense(\'autre\')" style="padding:10px 4px;background:#1A1A2E;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';border:1px solid '+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';border-radius:8px;cursor:pointer;font-size:10px;">Autre</button>' +

                '</div>' +

                '<div id="expensesList" style="max-height:120px;overflow-y:auto;font-size:11px;"></div>' +

                '<div id="expensesTotal" style="margin-top:8px;text-align:right;font-weight:700;color:#EF4444;font-size:12px;"></div>' +

            '</div>' +

            // ASSIGNATION
            '<div class="card" style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : '#1E293B') +';border-radius:12px;padding:14px;margin-bottom:10px;">' +

                '<h3 style="color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';margin-bottom:8px;font-size:13px;">Assignation</h3>' +

                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">' +

                    '<div>' +
                        '<span style="color:#94A3B8;">Véhicule</span><br>' +
                        '<span style="font-weight:600;color:#fff;" id="assignedVehicle">' +
                            escapeHtml(plate || 'Aucun') +
                        '</span>' +
                    '</div>' +

                    '<div>' +
                        '<span style="color:#94A3B8;">Organisation</span><br>' +
                        '<span style="font-weight:600;color:#fff;">' +
                            escapeHtml(orgName) +
                        '</span>' +
                    '</div>' +

                '</div>' +
            '</div>' +

        '</div>';

    // ------------------------------------
    // FORMULAIRE COURSE
    // ------------------------------------

    updateCourseForm();

    // ------------------------------------
    // NOTIFICATIONS
    // ------------------------------------

    await loadCourseNotifications();

    // ------------------------------------
    // STATS / DEPENSES
    // ------------------------------------

    await loadStats(driverId);

    await chargerCourseActive();

    // Forcer l'affichage de la carte si une course est active
    if (courseActive) {
      afficherCourseActive();
    }

    loadExpenses();

    // ------------------------------------
    // POLLING
    // ------------------------------------

    if (refreshInterval) {
        clearInterval(refreshInterval);
    }

    refreshInterval = setInterval(function () {
        loadStats(driverId);
    }, 30000);

    if (notificationInterval) {
        clearInterval(notificationInterval);
    }

    notificationInterval = setInterval(function () {
        loadNotificationBadge();
    }, 30000);

    await loadNotificationBadge();
}


// ========================================
// HEADER DE CHARGEMENT
// ========================================

function getHeaderLoadingHTML() {
    return (
        '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : '#1E293B') +';padding:14px;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';text-align:center;border-bottom:1px solid '+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';">' +
            'Dagoo\'s Fleet Driver' +
        '</div>'
    );
}


// ========================================
// NOTIFICATIONS
// ========================================

async function loadCourseNotifications() {
    try {
        var notifs = await apiGet(
            '/notifications?type=course_request&read=false'
        );

        notifs = Array.isArray(notifs)
            ? notifs.filter(function (notification) {
                // Vérifier si cette notification a déjà été traitée
                var coursesAcceptees = [];
                try {
                    coursesAcceptees = JSON.parse(
                        localStorage.getItem('dagoo_courses_acceptees') || '[]'
                    );
                } catch(e) {}

                var dejaAcceptee = coursesAcceptees.some(function(c) {
                    return c.notificationId === notification.id;
                });

                var dejaRefusee = false;
                try {
                    var coursesRefusees = JSON.parse(
                        localStorage.getItem('dagoo_courses_refusees') || '[]'
                    );
                    dejaRefusee = coursesRefusees.indexOf(notification.id) !== -1;
                } catch(e) {}

                return (
                    (notification.type === 'course_request' ||
                     notification.type === 'lead_action') &&
                    !dejaAcceptee &&
                    !dejaRefusee &&
                    notification.read === false
                );
            })
            : [];

        if (!notifs.length) {
            return;
        }

        var notifHtml =
            '<div id="courseNotifications" style="background:#FEF3C7;border-radius:12px;padding:12px;margin-bottom:12px;">' +

                '<p style="font-weight:bold;color:#92400E;margin-bottom:8px;">' +
                    'Nouvelles courses disponibles' +
                '</p>';

        notifs.forEach(function (notification) {

            notifHtml +=
                '<div style="background:white;border-radius:8px;padding:10px;margin-bottom:6px;">' +

                    '<p style="font-weight:bold;color:#1F2937;">' +
                        escapeHtml(
                            notification.title ||
                            'Course disponible'
                        ) +
                    '</p>' +

                    '<p style="font-size:12px;color:#6B7280;margin-top:2px;">' +
                        escapeHtml(
                            notification.message || ''
                        ) +
                    '</p>' +

                    '<div style="display:flex;gap:8px;margin-top:8px;">' +

                        '<button onclick="accepterCourse(\'' +
                            escapeHtml(notification.leadActionId || notification.id) +
                            '\', \'' +
                            escapeHtml(notification.id) +
                            '\')" style="flex:1;background:#10B981;color:white;border:none;padding:8px 12px;border-radius:6px;font-weight:bold;">' +
                            'Accepter' +
                        '</button>' +

                        '<button onclick="refuserCourse(\'' +
                            escapeHtml(notification.leadActionId || notification.id) +
                            '\', \'' +
                            escapeHtml(notification.id) +
                            '\')" style="flex:1;background:#EF4444;color:white;border:none;padding:8px 12px;border-radius:6px;font-weight:bold;">' +
                            'Refuser' +
                        '</button>' +

                    '</div>' +
                '</div>';
        });

        notifHtml += '</div>';

        var main = document.getElementById('mainContent');

        var contentDiv = main
            ? main.querySelector('div[style*="max-width"]')
            : null;

        if (contentDiv) {
            contentDiv.insertAdjacentHTML(
                'afterbegin',
                notifHtml
            );
        }

    } catch (e) {
        console.warn('Notifications courses indisponibles:', e);
    }
}

async function loadNotificationBadge() {
    try {
        var notifs = await apiGet('/notifications?read=false');

        var badge = document.getElementById('notifBadge');

        if (!badge) {
            return;
        }

        var count =
            Array.isArray(notifs)
                ? notifs.length
                : 0;

        badge.textContent = count;

        badge.style.display =
            count > 0
                ? 'flex'
                : 'none';

    } catch (e) {
        // Pas d'interruption du dashboard.
    }
}


// ========================================
// STATISTIQUES
// ========================================

async function loadStats(driverId) {
    try {
        if (!driverId) {
            return;
        }

        var courses = await apiGet(
            '/finances/courses?driverId=' +
            encodeURIComponent(driverId)
        );

        var arr =
            Array.isArray(courses)
                ? courses
                : [];

        var today = getTodayString();

        // Filtrer uniquement les courses TERMINEE
        var arrTerminees = arr.filter(function (course) {
            return course.statut === 'TERMINEE';
        });

        var todayCourses = arrTerminees.filter(function (course) {
            if (!course.date) return false;
            var courseDate = new Date(course.date);
            var courseDay = courseDate.toISOString().split('T')[0];
            return courseDay === today;
        });

        var weekCourses = arrTerminees.filter(function (course) {
            if (!course.date) return false;
            var courseDate = new Date(course.date);
            var courseDay = courseDate.toISOString().split('T')[0];
            return courseDay >= getWeekStartString() && courseDay <= today;
        });

        var caJour = todayCourses.reduce(
            function (sum, course) {
                return sum + (Number(course.price) || 0);
            },
            0
        );

        var caSem = weekCourses.reduce(
            function (sum, course) {
                return sum + (Number(course.price) || 0);
            },
            0
        );

        // Utiliser les montants figés (montantChauffeur / montantOrganisation)
        var chauffeurJour = todayCourses.reduce(
            function (sum, course) {
                return sum + (Number(course.montantChauffeur) || 0);
            },
            0
        );

        var versementJour = todayCourses.reduce(
            function (sum, course) {
                return sum + (Number(course.montantOrganisation) || Number(course.commission) || 0);
            },
            0
        );

        var chauffeurSem = weekCourses.reduce(
            function (sum, course) {
                return sum + (Number(course.montantChauffeur) || 0);
            },
            0
        );

        var versementSem = weekCourses.reduce(
            function (sum, course) {
                return sum + (Number(course.montantOrganisation) || Number(course.commission) || 0);
            },
            0
        );

        setText(
            'statCoursesJour',
            todayCourses.length
        );

        setText(
            'statCAJour',
            formatNumber(caJour)
        );

        setText(
            'statCommissionJour',
            formatNumber(chauffeurJour)
        );

        setText(
            'statNetJour',
            formatNumber(versementJour)
        );

        setText(
            'statCoursesSem',
            weekCourses.length
        );

        setText(
            'statCASem',
            formatNumber(caSem)
        );

        setText(
            'statCommissionSem',
            formatNumber(chauffeurSem)
        );

        setText(
            'statNetSem',
            formatNumber(versementSem)
        );

    } catch (e) {
        console.error('Stats:', e);
    }
}


// ========================================
// FORMULAIRE COURSE
// ========================================

async function calcCourse() {
    var type =
        document.getElementById('typeCourse')?.value ||
        'courseNormale';

    if (type === 'tarifFixe') {
        var fixe = getBaseTarif(type);
        setText('distanceCalc', '-');
        setText('prixCalc', fixe > 0 ? formatAmount(fixe) : 'Tarif indisponible');
        return;
    }

    var depart =
        parseFloat(
            document.getElementById('kmDepart')?.value
        ) || 0;

    var arrivee =
        parseFloat(
            document.getElementById('kmArrivee')?.value
        ) || 0;

    if (arrivee <= depart || depart <= 0) {
        setText('distanceCalc', '0');
        setText('prixCalc', '0 Ar');
        return;
    }

    var distance = arrivee - depart;

    setText(
        'distanceCalc',
        distance.toFixed(1)
    );

    // Calcul local basé sur les tarifs de l'organisation
    // (le formulaire PWA utilise des compteurs km, pas des adresses)
    var base = getBaseTarif(type);
    var prixKm = getKmTarif(type);

    if (!base && !prixKm) {
        setText('prixCalc', 'Tarif indisponible');
        return;
    }

    var prix = Math.round(base + (distance * prixKm));
    setText('prixCalc', formatAmount(prix));
}

function updateCourseForm() {
    var type =
        document.getElementById('typeCourse')?.value ||
        'courseNormale';

    var form =
        document.getElementById('courseForm');

    if (!form) {
        return;
    }

    var commissionPct = getCommissionPct();
    var commissionLine =
        '<div style="font-size:10px;color:#888;text-align:center;margin-bottom:8px;">' +
            'Part chauffeur : ' + commissionPct + ' % · À verser : ' + (100 - commissionPct) + ' %' +
        '</div>';

    if (type === 'locationJournalier' || type === 'locationSpeciale') {

        var locationTarif =
            getLocationTarif(type);

        form.innerHTML =
            '<div style="text-align:center;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';padding:10px;">' +

                (
                    locationTarif > 0
                        ? 'Tarif location : ' +
                          formatAmount(locationTarif) +
                          ' / jour'
                        : 'Tarif de location indisponible'
                ) +

            '</div>' +

            '<div style="font-size:10px;color:#888;text-align:center;margin-bottom:8px;">' +
                'La tarification est fournie par l\'organisation.' +
            '</div>';

        return;
    }

    if (type === 'adyVarotra') {

        form.innerHTML =
            '<input type="number" id="montantAdy" placeholder="Montant négocié (Ar)" min="1" style="width:100%;padding:8px;background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : '#252525') +';border:1px solid #333;border-radius:8px;color:#fff;font-size:12px;margin-bottom:8px;">' +
            commissionLine;

        return;
    }

    if (type === 'tarifFixe') {

        var fixe = getBaseTarif(type);

        form.innerHTML =
            '<div style="text-align:center;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';padding:10px;font-size:16px;font-weight:700;" id="prixCalc">' +
                (fixe > 0 ? formatAmount(fixe) : 'Tarif indisponible') +
            '</div>' +
            commissionLine;

        return;
    }

    form.innerHTML =
        '<div style="display:flex;gap:8px;margin-bottom:8px;">' +

            '<input type="number" id="kmDepart" placeholder="Km départ" step="0.1" min="0" oninput="calcCourse()" style="flex:1;padding:8px;background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : '#252525') +';border:1px solid #333;border-radius:8px;color:#fff;font-size:12px;">' +

            '<input type="number" id="kmArrivee" placeholder="Km arrivée" step="0.1" min="0" oninput="calcCourse()" style="flex:1;padding:8px;background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : '#252525') +';border:1px solid #333;border-radius:8px;color:#fff;font-size:12px;">' +

        '</div>' +

        '<div style="text-align:center;color:#94A3B8;font-size:11px;margin-bottom:8px;">' +

            'Distance : <span id="distanceCalc">0</span> km' +

            ' | Prix : <span id="prixCalc" style="color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';font-weight:700;">0 Ar</span>' +

        '</div>' +

        commissionLine;

    calcCourse();
}


// ========================================
// ENREGISTREMENT COURSE
// ========================================

async function enregistrerCourse() {

    var type =
        document.getElementById('typeCourse')?.value ||
        'courseNormale';

    var user = getDriverUser();

    var msg =
        document.getElementById('courseMsg');

    var distance = 0;
    var montant = 0;

    if (!currentVehicle || !currentVehicle.id) {
        if (msg) {
            msg.innerHTML =
                '<span style="color:#F87171;">Véhicule non assigné</span>';
        }

        return;
    }

    // ------------------------------------
    // COURSE NORMALE (moto/voiture, au km)
    // ------------------------------------

    if (type === 'courseNormale') {

        var d =
            parseFloat(
                document.getElementById('kmDepart')?.value
            ) || 0;

        var a =
            parseFloat(
                document.getElementById('kmArrivee')?.value
            ) || 0;

        if (a <= d || d <= 0) {

            if (msg) {
                msg.innerHTML =
                    '<span style="color:#F87171;">Km invalides</span>';
            }

            return;
        }

        distance = a - d;

        var base = getBaseTarif(type);
        var prixKm = getKmTarif(type);

        if (!base && !prixKm) {

            if (msg) {
                msg.innerHTML =
                    '<span style="color:#F87171;">Tarif de course indisponible</span>';
            }

            return;
        }

        montant =
            Math.round(
                base +
                (distance * prixKm)
            );
    }

    // ------------------------------------
    // ADY VAROTRA (montant négocié)
    // ------------------------------------

    else if (type === 'adyVarotra') {

        montant =
            parseFloat(
                document.getElementById('montantAdy')?.value
            ) || 0;

        if (montant <= 0) {

            if (msg) {
                msg.innerHTML =
                    '<span style="color:#F87171;">Montant requis</span>';
            }

            return;
        }
    }

    // ------------------------------------
    // TARIF FIXE (bus / mini van / tricycle)
    // ------------------------------------

    else if (type === 'tarifFixe') {

        montant = getBaseTarif(type);

        if (montant <= 0) {

            if (msg) {
                msg.innerHTML =
                    '<span style="color:#F87171;">Tarif indisponible</span>';
            }

            return;
        }
    }

    // ------------------------------------
    // LOCATION (journalière ou spéciale)
    // ------------------------------------

    else if (type === 'locationJournalier' || type === 'locationSpeciale') {

        montant = getLocationTarif(type);

        if (montant <= 0) {

            if (msg) {
                msg.innerHTML =
                    '<span style="color:#F87171;">Tarif de location indisponible</span>';
            }

            return;
        }
    }

    if (montant <= 0) {
        return;
    }

    var commissionPct = getCommissionPct();

    var chauffeurPart =
        Math.round(montant * (commissionPct / 100));

    var versement =
        montant - chauffeurPart;

    var confirmation =
        'Confirmer la course ?\n\n' +

        (
            (type === 'locationJournalier' || type === 'locationSpeciale')
                ? 'Location : ' + formatAmount(montant)
                : distance > 0
                    ? 'Distance : ' +
                      distance.toFixed(1) +
                      ' km\nPrix : ' +
                      formatAmount(montant)
                    : 'Montant : ' +
                      formatAmount(montant)
        ) +

        '\n\nPart chauffeur : ' +
        formatAmount(chauffeurPart) +

        '\nÀ verser : ' +
        formatAmount(versement);

    if (!confirm(confirmation)) {
        return;
    }

    try {

        var response =
            await fetch(
                getApiUrl() +
                '/finances/courses',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization':
                            'Bearer ' +
                            getDriverToken()
                    },

                    body: JSON.stringify({
                        driverId: user.driverId,
                        vehicleId: currentVehicle.id,
                        type: type,
                        distanceKm: distance,
                        price: montant,
                        commission: versement
                    })
                }
            );

        var data = {};

        try {
            data = await response.json();
        } catch (e) {
            data = {};
        }

        if (!response.ok) {

            if (msg) {
                msg.innerHTML =
                    '<span style="color:#F87171;">' +
                    escapeHtml(
                        data.error ||
                        data.message ||
                        'Erreur lors de l\'enregistrement'
                    ) +
                    '</span>';
            }

            return;
        }

        if (msg) {
            msg.innerHTML =
                '<span style="color:'+ (window.FLEET_THEME ? window.FLEET_THEME.success : '#22C55E') +';">' +
                    'Course enregistrée avec succès' +
                '</span>';
        }

        // Nettoyage
        var kmD =
            document.getElementById('kmDepart');

        var kmA =
            document.getElementById('kmArrivee');

        var montantAdy =
            document.getElementById('montantAdy');

        if (kmD) kmD.value = '';
        if (kmA) kmA.value = '';
        if (montantAdy) montantAdy.value = '';

        setText('distanceCalc', '0');
        setText('prixCalc', '0 Ar');

        await loadStats(user.driverId);

    } catch (e) {

        console.error(
            'Enregistrement course:',
            e
        );

        if (msg) {
            msg.innerHTML =
                '<span style="color:#F87171;">' +
                    'Erreur réseau' +
                '</span>';
        }
    }
}


// ========================================
// CYCLE DE VIE COURSE
// ========================================

var courseActive = null;

async function chargerCourseActive() {
    var user = getDriverUser();

    if (!user.driverId) return;

    try {
        var courses = await apiGet(
            '/finances/courses?driverId=' + encodeURIComponent(user.driverId)
        );

        var arr = Array.isArray(courses) ? courses : [];

        // Trouver la course active (non terminée, non annulée)
        courseActive = arr.find(function(c) {
            return c.statut === 'EN_ATTENTE' ||
                   c.statut === 'EN_ROUTE' ||
                   c.statut === 'EN_COURS';
        }) || null;

        window.courseActive = courseActive;

        if (courseActive) {
            afficherCourseActive();
        }
    } catch(e) {
        console.warn('Course active:', e);
    }
}

function afficherCourseActive() {
    var card = document.getElementById('courseActiveCard');
    if (!card || !courseActive) return;

    var statutLabel =
        courseActive.statut === 'EN_ATTENTE' ? 'En attente' :
        courseActive.statut === 'EN_ROUTE' ? 'En route vers le client' :
        courseActive.statut === 'EN_COURS' ? 'Course en cours' :
        courseActive.statut;

    var boutons = '';

    if (courseActive.statut === 'EN_ATTENTE') {
        boutons =
            '<button onclick="demarrerCourse(\'' + courseActive.id + '\')" style="flex:1;background:#10B981;color:white;border:none;padding:10px;border-radius:8px;font-weight:bold;cursor:pointer;">Démarrer</button>' +
            '<button onclick="annulerCourse(\'' + courseActive.id + '\')" style="flex:1;background:#EF4444;color:white;border:none;padding:10px;border-radius:8px;font-weight:bold;cursor:pointer;">Annuler</button>';
    } else if (courseActive.statut === 'EN_ROUTE') {
        boutons =
            '<button onclick="clientPrisEnCharge(\'' + courseActive.id + '\')" style="flex:1;background:#3B82F6;color:white;border:none;padding:10px;border-radius:8px;font-weight:bold;cursor:pointer;">Client pris en charge</button>' +
            '<button onclick="annulerCourse(\'' + courseActive.id + '\')" style="flex:1;background:#EF4444;color:white;border:none;padding:10px;border-radius:8px;font-weight:bold;cursor:pointer;">Annuler</button>';
    } else if (courseActive.statut === 'EN_COURS') {
        boutons =
            '<button onclick="terminerCourse(\'' + courseActive.id + '\')" style="flex:1;background:#F1C40F;color:#1A1A2E;border:none;padding:10px;border-radius:8px;font-weight:bold;cursor:pointer;">Terminer</button>' +
            '<button onclick="annulerCourse(\'' + courseActive.id + '\')" style="flex:1;background:#EF4444;color:white;border:none;padding:10px;border-radius:8px;font-weight:bold;cursor:pointer;">Annuler</button>';
    }

    card.innerHTML =
        '<div style="background:#FEF3C7;border-radius:12px;padding:12px;margin-bottom:10px;border:2px solid #F59E0B;">' +
            '<h3 style="font-weight:bold;color:#92400E;margin-bottom:8px;font-size:13px;">🚕 Course en cours</h3>' +
            '<p style="font-size:12px;color:#1F2937;font-weight:bold;">' + escapeHtml(statutLabel) + '</p>' +
            '<p style="font-size:12px;color:#6B7280;">Client : ' + escapeHtml(courseActive.clientNom || courseActive.clientTel || '—') + '</p>' +
            '<p style="font-size:12px;color:#6B7280;">' + escapeHtml(courseActive.adresseDepart || 'Départ inconnu') + ' → ' + escapeHtml(courseActive.adresseArrivee || 'Arrivée inconnue') + '</p>' +
            '<p style="font-size:12px;color:#1F2937;font-weight:bold;">Prix : ' + formatAmount(courseActive.price) + '</p>' +
            '<p style="font-size:11px;color:#6B7280;">Part chauffeur : ' + formatAmount(courseActive.montantChauffeur || courseActive.price * (courseActive.commissionPct || 20) / 100) + '</p>'
            '<p style="font-size:11px;color:#6B7280;">À verser : ' + formatAmount(courseActive.montantOrganisation || courseActive.commission || 0) + '</p>' +
            '<div style="display:flex;gap:8px;margin-top:8px;">' + boutons + '</div>' +
        '</div>';
}

async function demarrerCourse(courseId) {
    try {
        var response = await fetch(
            getApiUrl() + '/finances/courses/' + encodeURIComponent(courseId) + '/start',
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + getDriverToken(),
                    'Content-Type': 'application/json'
                }
            }
        );

        var data = {};
        try { data = await response.json(); } catch(e) {}

        if (!response.ok) {
            alert(data.error || 'Impossible de démarrer la course');
            return;
        }

        courseActive.statut = 'EN_ROUTE';
        courseActive.startedAt = data.startedAt;
        afficherCourseActive();
        await loadStats(getDriverUser().driverId);

    } catch(e) {
        console.error('Démarrer course:', e);
        alert('Erreur réseau');
    }
}

async function clientPrisEnCharge(courseId) {
    // Transition EN_ROUTE → EN_COURS via la route métier pickup
    try {
        var response = await fetch(
            getApiUrl() + '/finances/courses/' + encodeURIComponent(courseId) + '/pickup',
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + getDriverToken(),
                    'Content-Type': 'application/json'
                }
            }
        );

        var data = {};
        try { data = await response.json(); } catch(e) {}

        if (!response.ok) {
            alert(data.error || 'Impossible de prendre le client en charge');
            return;
        }

        courseActive.statut = 'EN_COURS';
        afficherCourseActive();

    } catch(e) {
        console.error('Client pris en charge:', e);
        alert('Erreur réseau');
    }
}

async function terminerCourse(courseId) {
    var distanceFinale = prompt('Distance réelle (km) :', String(courseActive.distanceKm || 0));

    if (distanceFinale === null) return;

    var distance = parseFloat(distanceFinale);

    if (isNaN(distance) || distance < 0) {
        alert('Distance invalide');
        return;
    }

    try {
        var response = await fetch(
            getApiUrl() + '/finances/courses/' + encodeURIComponent(courseId) + '/complete',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + getDriverToken()
                },
                body: JSON.stringify({ distanceKm: distance })
            }
        );

        var data = {};
        try { data = await response.json(); } catch(e) {}

        if (!response.ok) {
            alert(data.error || 'Impossible de terminer la course');
            return;
        }

        courseActive.statut = 'TERMINEE';
        courseActive.completedAt = data.completedAt;
        courseActive.distanceKm = data.distanceKm;

        // Masquer la carte active
        var card = document.getElementById('courseActiveCard');
        if (card) card.innerHTML = '';

        alert('Course terminée !');
        await init_home();

    } catch(e) {
        console.error('Terminer course:', e);
        alert('Erreur réseau');
    }
}

async function annulerCourse(courseId) {
    var motif = prompt('Motif d\'annulation :', 'ANNULATION_CHAUFFEUR');

    if (motif === null) return;

    try {
        var response = await fetch(
            getApiUrl() + '/finances/courses/' + encodeURIComponent(courseId) + '/cancel',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + getDriverToken()
                },
                body: JSON.stringify({ motifAnnulation: motif })
            }
        );

        var data = {};
        try { data = await response.json(); } catch(e) {}

        if (!response.ok) {
            alert(data.error || 'Impossible d\'annuler la course');
            return;
        }

        courseActive.statut = 'ANNULEE';
        courseActive.cancelledAt = data.cancelledAt;

        var card = document.getElementById('courseActiveCard');
        if (card) card.innerHTML = '';

        alert('Course annulée.');
        await init_home();

    } catch(e) {
        console.error('Annuler course:', e);
        alert('Erreur réseau');
    }
}

// ========================================
// STATUT CHAUFFEUR
// ========================================

async function changeStatus(status) {

    var statusApi =
        status === 'present'
            ? 'AVAILABLE'
            : status === 'pause'
                ? 'ON_BREAK'
                : 'OFFLINE';

    var msg =
        status === 'present'
            ? 'Passage en service'
            : status === 'pause'
                ? 'Mise en pause'
                : 'Fin de service';

    try {

        var response =
            await fetch(
                getApiUrl() +
                '/drivers/me/status',
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization':
                            'Bearer ' +
                            getDriverToken()
                    },

                    body: JSON.stringify({
                        status: statusApi
                    })
                }
            );

        if (!response.ok) {

            var errorData = {};

            try {
                errorData =
                    await response.json();
            } catch (e) {}

            alert(
                errorData.error ||
                errorData.message ||
                'Impossible de modifier le statut'
            );

            return;
        }

        window.statutPresence = status;

        if (status === 'termine') {

            await init_home();

            await proposerVersement();

            return;
        }

        console.log(msg);

        await init_home();

    } catch (e) {

        console.error(
            'Changement statut:',
            e
        );

        alert(
            'Erreur réseau lors du changement de statut'
        );
    }
}


// ========================================
// ACCEPTATION COURSE
// ========================================

async function accepterCourse(actionId, notificationId) {

    var user = getDriverUser();

    if (!user.driverId) {
        alert('Chauffeur non identifié');
        return;
    }

    try {

        // Appeler la vraie route métier d'acceptation
        var response = await fetch(
            getApiUrl() + '/actions/' + encodeURIComponent(actionId) + '/accept',
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + getDriverToken(),
                    'Content-Type': 'application/json'
                }
            }
        );

        var data = {};
        try {
            data = await response.json();
        } catch(e) {}

        if (!response.ok) {
            if (response.status === 409) {
                alert(data.error || 'Cette course a déjà été acceptée');
            } else {
                alert(data.error || 'Impossible d\'accepter la course');
            }
            await init_home();
            return;
        }

        // Succès : la Course a été créée par le backend
        alert('Course acceptée et enregistrée !');
        loadPage('courses');

    } catch (e) {

        console.error('Acceptation course:', e);
        alert('Erreur réseau lors de l\'acceptation');
    }
}


// ========================================
// REFUS COURSE
// ========================================

async function refuserCourse(actionId, notificationId) {

    try {

        // Appeler la vraie route métier de refus
        var response = await fetch(
            getApiUrl() + '/actions/' + encodeURIComponent(actionId) + '/reject',
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + getDriverToken(),
                    'Content-Type': 'application/json'
                }
            }
        );

        var data = {};
        try {
            data = await response.json();
        } catch(e) {}

        if (!response.ok) {
            alert(data.error || 'Impossible de refuser la course');
            await init_home();
            return;
        }

        alert('Course refusée.');

        await init_home();

    } catch (e) {

        console.error('Refus course:', e);
        alert('Erreur réseau lors du refus');
    }
}


// ========================================
// VERSEMENT
// ========================================

async function proposerVersement() {

    var user = getDriverUser();

    if (!user.driverId) {
        return;
    }

    try {

        var courses =
            await apiGet(
                '/finances/courses?driverId=' +
                encodeURIComponent(user.driverId)
            );

        var arr =
            Array.isArray(courses)
                ? courses
                : [];

        var today =
            getTodayString();

        var todayCourses =
            arr.filter(function (course) {
                return (
                    course.date &&
                    String(course.date).startsWith(today)
                );
            });

        var caJour =
            todayCourses.reduce(
                function (sum, course) {
                    return sum +
                        (Number(course.price) || 0);
                },
                0
            );

        var netJour =
            Math.round(caJour * ((100 - getCommissionPct()) / 100));

        if (netJour <= 0) {
            return;
        }

        var confirmation =
            confirm(
                'Service terminé.\n\n' +
                'Montant à verser disponible : ' +
                formatAmount(netJour) +
                '\n\nSouhaitez-vous demander un versement ?'
            );

        if (!confirmation) {
            return;
        }

        var montant =
            prompt(
                'Montant à verser (maximum ' +
                formatAmount(netJour) +
                ') :',
                String(netJour)
            );

        if (!montant) {
            return;
        }

        montant =
            parseInt(montant, 10);

        if (
            isNaN(montant) ||
            montant <= 0 ||
            montant > netJour
        ) {
            alert(
                'Montant invalide. Le maximum disponible est ' +
                formatAmount(netJour) +
                '.'
            );

            return;
        }

        var periode =
            new Date()
                .toISOString()
                .slice(0, 7);

        var response =
            await fetch(
                getApiUrl() +
                '/versements',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            'Bearer ' +
                            getDriverToken()
                    },

                    body: JSON.stringify({
                        driverId:
                            user.driverId,

                        amount:
                            montant,

                        method:
                            'especes',

                        periode:
                            periode
                    })
                }
            );

        var data = {};

        try {
            data =
                await response.json();
        } catch (e) {}

        if (!response.ok) {

            alert(
                data.error ||
                data.message ||
                'Impossible d\'envoyer la demande de versement.'
            );

            return;
        }

        alert(
            'Demande de versement envoyée : ' +
            formatAmount(montant)
        );

    } catch (e) {

        console.error(
            'Versement:',
            e
        );

        alert(
            'Erreur réseau lors de la demande de versement.'
        );
    }
}


// ========================================
// DEPENSES
// ========================================
//
// IMPORTANT :
// Le code fourni ne montre pas de route API dépenses
// exploitable côté Driver. Les dépenses restent donc
// locales pour le moment.
// Elles devront être branchées à l'API dès qu'un endpoint
// backend dédié sera confirmé.
//

function addExpense(type) {

    var amount =
        prompt(
            'Montant (' +
            type +
            ') en Ar :'
        );

    if (
        !amount ||
        isNaN(amount) ||
        parseInt(amount, 10) <= 0
    ) {
        return;
    }

    var desc =
        prompt('Description :') ||
        type;

    expenses.push({
        type: type,
        amount: parseInt(amount, 10),
        desc: desc,
        time:
            new Date().toLocaleTimeString()
    });

    try {
        localStorage.setItem(
            'driver_expenses',
            JSON.stringify(expenses)
        );
    } catch (e) {}

    renderExpenses();
}

function renderExpenses() {

    var list =
        document.getElementById(
            'expensesList'
        );

    var total =
        document.getElementById(
            'expensesTotal'
        );

    if (!list) {
        return;
    }

    if (!expenses.length) {

        list.innerHTML =
            '<div style="color:#94A3B8;text-align:center;padding:10px;">' +
                'Aucune dépense' +
            '</div>';

        if (total) {
            total.textContent = '';
        }

        return;
    }

    var html = '';
    var sum = 0;

    var recent =
        expenses
            .slice(-10)
            .reverse();

    var labels = {
        carburant: 'Carburant',
        entretien: 'Entretien',
        pneu: 'Pneus',
        autre: 'Autre'
    };

    for (
        var i = 0;
        i < recent.length;
        i++
    ) {

        var expense =
            recent[i];

        var amount =
            Number(expense.amount) || 0;

        html +=
            '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #333;gap:8px;">' +

                '<span style="color:#94A3B8;font-size:11px;">' +
                    escapeHtml(
                        labels[expense.type] ||
                        expense.type
                    ) +
                    ' - ' +
                    escapeHtml(
                        expense.desc
                    ) +
                '</span>' +

                '<span style="color:#F87171;font-weight:600;white-space:nowrap;">' +
                    formatAmount(amount) +
                '</span>' +

            '</div>';

        sum += amount;
    }

    list.innerHTML = html;

    if (total) {
        total.textContent =
            'Total : ' +
            formatAmount(sum);
    }
}

function loadExpenses() {

    try {

        var saved =
            localStorage.getItem(
                'driver_expenses'
            );

        if (!saved) {
            expenses = [];
            renderExpenses();
            return;
        }

        var parsed =
            JSON.parse(saved);

        expenses =
            Array.isArray(parsed)
                ? parsed
                : [];

        renderExpenses();

    } catch (e) {

        expenses = [];

        renderExpenses();
    }
}


// ========================================
// INFOS VEHICULE
// ========================================

async function loadDriverVehicleInfo() {

    var vehicleBadge =
        document.getElementById(
            'vehicleStatusBadge'
        );

    var vehicleNameEl =
        document.getElementById(
            'assignedVehicleName'
        );

    try {

        var data =
            await apiGet('/drivers/me');

        if (
            data &&
            data.vehicle
        ) {

            if (vehicleBadge) {

                vehicleBadge.textContent =
                    data.vehicle.plate ||
                    'Véhicule assigné';

                vehicleBadge.className =
                    'badge badge-success';
            }

            if (vehicleNameEl) {

                vehicleNameEl.textContent =
                    data.vehicle.plate ||
                    data.vehicle.model ||
                    'Véhicule';
            }

        } else {

            if (vehicleBadge) {

                vehicleBadge.textContent =
                    'Sans véhicule';

                vehicleBadge.className =
                    'badge badge-danger';
            }
        }

    } catch (err) {

        console.warn(
            'Impossible de charger les données du véhicule:',
            err
        );
    }
}


// ========================================
// ONLINE / OFFLINE
// ========================================

// ========================================
// DÉTECTION FERMETURE APPLICATION
// ========================================

// À la fermeture du navigateur ou de l'app
window.addEventListener('beforeunload', function() {
    if (getDriverToken()) {
        fetch(getApiUrl() + '/drivers/me/status', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getDriverToken()
            },
            body: JSON.stringify({ status: 'OFFLINE' }),
            keepalive: true
        }).catch(function() {});
    }
});

// Passage en arrière-plan (mobile)
document.addEventListener('visibilitychange', function() {
    if (document.hidden && getDriverToken()) {
        fetch(getApiUrl() + '/drivers/me/status', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getDriverToken()
            },
            body: JSON.stringify({ status: 'OFFLINE' }),
            keepalive: true
        }).catch(function() {});
    }
});

window.addEventListener(
    'online',
    function () {
        isOnline = true;
    }
);

window.addEventListener(
    'offline',
    function () {
        isOnline = false;
    }
);


// ========================================
// EXPORTS GLOBAUX
// ========================================

window.init_home =
    init_home;

window.addExpense =
    addExpense;

window.changeStatus =
    changeStatus;

window.enregistrerCourse =
    enregistrerCourse;

window.calcCourse =
    calcCourse;

window.updateCourseForm =
    updateCourseForm;

window.loadStats =
    loadStats;

window.accepterCourse =
    accepterCourse;

window.refuserCourse =
    refuserCourse;

window.chargerCourseActive =
    chargerCourseActive;

window.demarrerCourse =
    demarrerCourse;

window.clientPrisEnCharge =
    clientPrisEnCharge;

window.terminerCourse =
    terminerCourse;

window.annulerCourse =
    annulerCourse;

window.proposerVersement =
    proposerVersement;

window.loadExpenses =
    loadExpenses;


// ========================================
// INITIALISATION VEHICULE
// ========================================

document.addEventListener(
    'DOMContentLoaded',
    function () {
        loadDriverVehicleInfo();
    }
);