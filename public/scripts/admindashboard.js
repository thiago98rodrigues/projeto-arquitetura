/**
 * CONTROLADOR PRINCIPAL — BUSGO ADMIN DASHBOARD
 * Lógica do simulador GPS, CRUD de veículos, roteamento de abas,
 * relatórios de paradas, central de alertas e responsividade.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================================================
    // ESTADO E CONFIGURAÇÕES GERAIS
    // ==========================================================================
    
    let state = {
        vehicles: [],
        logs: [],
        alerts: [],
        activeTab: 'dashboard',
        selectedBusId: null,
        simSpeed: 1, // 1 a 5 (segundos por passo)
        simActive: true,
        simAlertsActive: true,
        soundEnabled: true,
        pushEnabled: false,
        autoClearLogs: true,
        unreadAlertsCount: 3,
        searchQuery: ''
    };

    // Definição das rotas e suas paradas associadas com porcentagem de rota
    const routesData = {
        "Rota Norte (Azul)": {
            color: '#0088ff',
            class: 'blue',
            svgPathId: 'route-blue',
            stops: [
                { name: 'Ponto Central A', progress: 10 },
                { name: 'Rua das Palmeiras', progress: 40 },
                { name: 'Escola Adventista', progress: 75 },
                { name: 'Terminal Norte', progress: 95 }
            ]
        },
        "Rota Sul (Verde)": {
            color: '#4CAF50',
            class: 'green',
            svgPathId: 'route-green',
            stops: [
                { name: 'Ponto Central B', progress: 15 },
                { name: 'Praça das Flores', progress: 45 },
                { name: 'Colégio Estadual', progress: 70 },
                { name: 'Terminal Sul', progress: 90 }
            ]
        },
        "Rota Leste (Vermelho)": {
            color: '#F44336',
            class: 'red',
            svgPathId: 'route-red',
            stops: [
                { name: 'Ponto Central C', progress: 20 },
                { name: 'Hospital Infantil', progress: 50 },
                { name: 'EMEF Castro Alves', progress: 80 }
            ]
        },
        "Rota Oeste (Amarelo)": {
            color: '#B7A200',
            class: 'yellow',
            svgPathId: 'route-yellow',
            stops: [
                { name: 'Terminal Oeste', progress: 10 },
                { name: 'Rua do Comércio', progress: 50 },
                { name: 'Parque das Nações', progress: 85 }
            ]
        }
    };

    // Dados Iniciais Fictícios
    const defaultVehicles = [
        {
            id: 'v1',
            number: '101',
            plate: 'XYZ-9081',
            model: 'Mercedes-Benz OF-1721',
            year: 2021,
            capacity: 48,
            driver: 'Carlos Souza',
            phone: '(11) 91111-2222',
            route: 'Rota Norte (Azul)',
            status: 'Online',
            speed: 45,
            nextStop: 'Escola Adventista',
            occupancy: 28,
            progress: 10,
            direction: 1
        },
        {
            id: 'v2',
            number: '102',
            plate: 'JKL-4052',
            model: 'Volvo B270F',
            year: 2023,
            capacity: 40,
            driver: 'Mariana Mendes',
            phone: '(11) 93333-4444',
            route: 'Rota Sul (Verde)',
            status: 'Online',
            speed: 38,
            nextStop: 'Colégio Estadual',
            occupancy: 12,
            progress: 45,
            direction: 1
        },
        {
            id: 'v3',
            number: '103',
            plate: 'KAS-1290',
            model: 'Mercedes-Benz OF-1519',
            year: 2020,
            capacity: 50,
            driver: 'Roberto Silva',
            phone: '(11) 95555-6666',
            route: 'Rota Leste (Vermelho)',
            status: 'Online',
            speed: 50,
            nextStop: 'EMEF Castro Alves',
            occupancy: 35,
            progress: 70,
            direction: 1
        },
        {
            id: 'v4',
            number: '104',
            plate: 'QWE-8742',
            model: 'Scania K250',
            year: 2022,
            capacity: 60,
            driver: 'André Santos',
            phone: '(11) 97777-8888',
            route: 'Rota Oeste (Amarelo)',
            status: 'Offline',
            speed: 0,
            nextStop: 'Terminal Oeste',
            occupancy: 0,
            progress: 0,
            direction: 1
        }
    ];

    const defaultLogs = [
        { time: '20:30:15', tag: 'info', msg: 'Simulação de frotas inicializada pela administradora.' },
        { time: '20:32:00', tag: 'success', msg: 'Veículo <strong>101</strong> (Carlos) conectou-se ao GPS operacional.' },
        { time: '20:33:14', tag: 'success', msg: 'Veículo <strong>102</strong> (Mariana) iniciou trânsito comercial.' },
        { time: '20:35:40', tag: 'success', msg: 'Veículo <strong>103</strong> (Roberto) iniciou trânsito comercial.' }
    ];

    const defaultAlerts = [
        {
            id: 'a1',
            type: 'Desvio de Rota',
            severity: 'critical',
            vehicle: '103',
            driver: 'Roberto Silva',
            time: '20:41:23',
            msg: 'Desvio grave detectado na Rota Leste (Vermelho).',
            detail: 'Distância desviada: 1.4 km de distância da rota escolar traçada.',
            read: false
        },
        {
            id: 'a2',
            type: 'Parada não programada',
            severity: 'warning',
            vehicle: '102',
            driver: 'Mariana Mendes',
            time: '20:43:05',
            msg: 'Parada longa fora de ponto comercial na Av. Atlântica.',
            detail: 'Localização: Av. Atlântica, Nº 2450. Tempo parado: 3 minutos.',
            read: false
        },
        {
            id: 'a3',
            type: 'Atraso na Rota',
            severity: 'warning',
            vehicle: '101',
            driver: 'Carlos Souza',
            time: '20:45:10',
            msg: 'Atraso acima de 5 minutos projetado para a próxima escola.',
            detail: 'Tempo de atraso estimado: 8 minutos.',
            read: false
        }
    ];

    const defaultReports = [
        { time: '20:31:00', stop: 'Ponto Central A', vehicle: '101', timeStopped: '1m 20s', boardings: 12, alightings: 0, occupancy: 12 },
        { time: '20:36:12', stop: 'Ponto Central B', vehicle: '102', timeStopped: '45s', boardings: 8, alightings: 0, occupancy: 8 },
        { time: '20:40:05', stop: 'Hospital Infantil', vehicle: '103', timeStopped: '1m 55s', boardings: 15, alightings: 2, occupancy: 13 },
        { time: '20:44:20', stop: 'Praça das Flores', vehicle: '102', timeStopped: '1m 15s', boardings: 6, alightings: 2, occupancy: 12 }
    ];

    // ==========================================================================
    // ELEMENTOS DO DOM
    // ==========================================================================
    
    const sidebar = document.getElementById('admin-sidebar');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Header & KPIs
    const headerDateEl = document.getElementById('header-date');
    const kpiBusVal = document.getElementById('kpi-bus-value');
    const kpiRoutesVal = document.getElementById('kpi-routes-value');
    const kpiStudentsVal = document.getElementById('kpi-students-value');
    const kpiAlertsVal = document.getElementById('kpi-alerts-value');
    const navAlertsBadge = document.getElementById('nav-alerts-badge');
    const bellCounter = document.getElementById('bell-counter');
    const notificationDropdown = document.getElementById('notification-dropdown');
    const notificationTrigger = document.getElementById('notification-trigger');
    const notificationList = document.getElementById('notification-list');
    const markAllReadBtn = document.getElementById('mark-all-read');
    const btnViewAllAlerts = document.getElementById('btn-view-all-alerts');
    const btnQuickAlerts = document.getElementById('btn-quick-alerts');

    // Global Search
    const globalSearchInput = document.getElementById('global-search');
    const searchDropdown = document.getElementById('search-results-dropdown');

    // Dashboard
    const dashboardMapContainer = document.getElementById('dashboard-map');
    const dashboardActiveBusesList = document.getElementById('dashboard-active-buses');
    const dashboardEventsLog = document.getElementById('dashboard-events-log');
    const activeBusesCountLabel = document.getElementById('active-buses-count');
    const btnClearLogs = document.getElementById('btn-clear-logs');

    // Monitoring
    const monitoringLargeMapContainer = document.getElementById('monitoring-large-map');
    const monitoringBusListEl = document.getElementById('monitoring-bus-list');
    const monitoringSearchInput = document.getElementById('monitoring-search');
    const selectedBusOverlay = document.getElementById('selected-bus-overlay');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnRecenter = document.getElementById('btn-recenter');

    // Vehicles CRUD
    const btnAddVehicle = document.getElementById('btn-add-vehicle');
    const vehicleModal = document.getElementById('vehicle-modal');
    const vehicleForm = document.getElementById('vehicle-form');
    const vehiclesTableBody = document.getElementById('vehicles-table-body');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const modalTitle = document.getElementById('modal-title');
    const filterVehicleSelect = document.getElementById('filter-vehicle');

    // Reports
    const reportsTableBody = document.getElementById('reports-table-body');
    const reportTotalStopsLabel = document.getElementById('report-total-stops');
    const reportAvgTimeLabel = document.getElementById('report-avg-time');
    const reportDelaysCountLabel = document.getElementById('report-delays-count');
    const filterDateInput = document.getElementById('filter-date');
    const filterDriverInput = document.getElementById('filter-driver');
    const filterRouteSelect = document.getElementById('filter-route');
    const btnApplyFilters = document.getElementById('btn-apply-filters');
    const btnResetFilters = document.getElementById('btn-reset-filters');

    // Alerts
    const alertsCardsContainer = document.getElementById('alerts-cards-container');
    const alertFilterButtons = document.querySelectorAll('.alert-filter-btn');

    // Settings
    const settingSimActive = document.getElementById('setting-sim-active');
    const settingSimSpeed = document.getElementById('setting-sim-speed');
    const settingSimSpeedVal = document.getElementById('setting-sim-speed-val');
    const settingSimAlerts = document.getElementById('setting-sim-alerts');
    const settingSoundAlerts = document.getElementById('setting-sound-alerts');
    const settingPushAlerts = document.getElementById('setting-push-alerts');
    const settingAutoClear = document.getElementById('setting-auto-clear');
    
    const settingsMenuButtons = document.querySelectorAll('.setting-menu-btn');
    const settingsPanelContents = document.querySelectorAll('.settings-panel-content');
    
    const profileNameInput = document.getElementById('profile-name');
    const profileEmailInput = document.getElementById('profile-email');
    const profilePhoneInput = document.getElementById('profile-phone');
    const btnSaveSimSettings = document.getElementById('btn-save-sim-settings');
    const btnSaveNotificationSettings = document.getElementById('btn-save-notification-settings');
    const btnSaveProfileSettings = document.getElementById('btn-save-profile-settings');
    const toastContainer = document.getElementById('toast-container');

    // Map Zooming Scale simulation
    let currentMapZoom = 1;

    // ==========================================================================
    // INICIALIZAÇÃO DOS DADOS (LOCAL STORAGE)
    // ==========================================================================
    
    function initLocalStorage() {
        if (!localStorage.getItem('busgo_vehicles')) {
            localStorage.setItem('busgo_vehicles', JSON.stringify(defaultVehicles));
        }
        if (!localStorage.getItem('busgo_logs')) {
            localStorage.setItem('busgo_logs', JSON.stringify(defaultLogs));
        }
        if (!localStorage.getItem('busgo_alerts')) {
            localStorage.setItem('busgo_alerts', JSON.stringify(defaultAlerts));
        }
        if (!localStorage.getItem('busgo_reports')) {
            localStorage.setItem('busgo_reports', JSON.stringify(defaultReports));
        }
        
        state.vehicles = JSON.parse(localStorage.getItem('busgo_vehicles'));
        state.logs = JSON.parse(localStorage.getItem('busgo_logs'));
        state.alerts = JSON.parse(localStorage.getItem('busgo_alerts'));
        state.reports = JSON.parse(localStorage.getItem('busgo_reports'));
        
        // Configurar data atual
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        headerDateEl.textContent = "Hoje, " + new Date().toLocaleDateString('pt-BR', options);
        filterDateInput.value = new Date().toISOString().split('T')[0];
    }

    function saveState(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // ==========================================================================
    // TOAST SYSTEM (MENSAGENS FLUTUANTES)
    // ==========================================================================
    
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconClass = 'fa-circle-info';
        if (type === 'success') iconClass = 'fa-circle-check';
        if (type === 'error') iconClass = 'fa-circle-xmark';
        if (type === 'warning') iconClass = 'fa-triangle-exclamation';

        toast.innerHTML = `
            <i class="fa-solid ${iconClass} toast-icon"></i>
            <div class="toast-message">${message}</div>
            <button class="toast-close"><i class="fa-solid fa-xmark"></i></button>
        `;

        toastContainer.appendChild(toast);

        // Som de alerta caso esteja habilitado
        if (type === 'error' && state.soundEnabled) {
            playAlertSound();
        }

        // Fechar no clique
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });

        // Fechamento automático
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    function playAlertSound() {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, context.currentTime); // Tom agudo
            osc.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.3);
            
            gain.gain.setValueAtTime(0.1, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.35);
            
            osc.connect(gain);
            gain.connect(context.destination);
            
            osc.start();
            osc.stop(context.currentTime + 0.4);
        } catch (e) {
            console.log("AudioContext não pôde tocar som antes da interação do usuário.");
        }
    }

    // ==========================================================================
    // ROTEAMENTO DE ABAS E NAVEGAÇÃO
    // ==========================================================================
    
    function switchTab(targetTab) {
        state.activeTab = targetTab;
        
        // Alternar classes dos itens de navegação
        navItems.forEach(item => {
            if (item.getAttribute('data-target') === targetTab) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Alternar classes dos conteúdos das abas
        tabContents.forEach(content => {
            if (content.getAttribute('id') === `${targetTab}-tab`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        // Redesenhar mapas se necessário
        if (targetTab === 'dashboard') {
            initSVGMap('dashboard-map');
            updateActiveBusesList();
            renderLogs();
        } else if (targetTab === 'monitoring') {
            initSVGMap('monitoring-large-map');
            updateMonitoringBusList();
            selectedBusOverlay.classList.add('hidden');
            state.selectedBusId = null;
        } else if (targetTab === 'vehicles') {
            renderVehiclesTable();
        } else if (targetTab === 'reports') {
            renderReportsTable();
            updateReportsIndicators();
        } else if (targetTab === 'alerts') {
            renderAlerts();
        }

        // Fechar Gaveta Lateral no mobile
        sidebar.classList.remove('open');
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            switchTab(target);
        });
    });

    // Vinculações de botões rápidos
    btnViewAllAlerts.addEventListener('click', () => {
        notificationDropdown.classList.add('hidden');
        switchTab('alerts');
    });

    btnQuickAlerts.addEventListener('click', () => {
        switchTab('alerts');
    });

    // Responsividade: Toggle Menu Hamburguer
    menuToggleBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
    });

    sidebarCloseBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    // Fechar gaveta ao clicar fora
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !menuToggleBtn.contains(e.target) && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        }
    });

    // ==========================================================================
    // NOTIFICAÇÕES & DROPDOWN DO HEADER
    // ==========================================================================
    
    function toggleNotifications() {
        notificationDropdown.classList.toggle('hidden');
    }

    notificationTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNotifications();
    });

    document.addEventListener('click', (e) => {
        if (!notificationDropdown.contains(e.target) && !notificationTrigger.contains(e.target)) {
            notificationDropdown.classList.add('hidden');
        }
    });

    function addSystemNotification(msg, severity = 'info') {
        const time = new Date().toLocaleTimeString('pt-BR');
        
        // Criar alerta
        const newAlert = {
            id: 'a_' + Date.now(),
            type: severity === 'critical' ? 'Desvio de Rota' : (severity === 'warning' ? 'Parada não programada' : 'Atualização'),
            severity: severity,
            vehicle: 'Simulado',
            driver: 'Sistema GPS',
            time: time,
            msg: msg,
            detail: msg,
            read: false
        };

        state.alerts.unshift(newAlert);
        saveState('busgo_alerts', state.alerts);
        
        // Se autolimpeza ativada, limitar alertas a 30
        if (state.alerts.length > 30) {
            state.alerts.pop();
        }

        updateNotificationBell();
        
        // Atualizar aba se estiver visível
        if (state.activeTab === 'alerts') {
            renderAlerts();
        }
        
        // Log operacional
        addLog(msg, severity === 'critical' ? 'critical' : (severity === 'warning' ? 'warning' : 'info'));
    }

    function updateNotificationBell() {
        const unreadCount = state.alerts.filter(a => !a.read).length;
        bellCounter.textContent = unreadCount;
        kpiAlertsVal.textContent = unreadCount;
        navAlertsBadge.textContent = unreadCount;

        if (unreadCount === 0) {
            bellCounter.style.display = 'none';
            navAlertsBadge.style.display = 'none';
        } else {
            bellCounter.style.display = 'flex';
            navAlertsBadge.style.display = 'flex';
        }

        // Renderizar itens no Dropdown
        notificationList.innerHTML = '';
        if (state.alerts.length === 0) {
            notificationList.innerHTML = `<li style="padding: 2rem; text-align: center; color: var(--color-muted)">Nenhuma notificação encontrada</li>`;
            return;
        }

        state.alerts.slice(0, 5).forEach(alert => {
            const li = document.createElement('li');
            li.className = `notification-item-row ${alert.read ? '' : 'unread'}`;
            li.innerHTML = `
                <div class="notification-icon-indicator ${alert.severity}">
                    <i class="fa-solid ${alert.severity === 'critical' ? 'fa-triangle-exclamation' : (alert.severity === 'warning' ? 'fa-clock-rotate-left' : 'fa-bell')}"></i>
                </div>
                <div class="notification-text-content">
                    <span class="notification-msg"><strong>${alert.type}</strong>: ${alert.msg}</span>
                    <span class="notification-time">${alert.time}</span>
                </div>
            `;
            li.addEventListener('click', () => {
                alert.read = true;
                saveState('busgo_alerts', state.alerts);
                updateNotificationBell();
                switchTab('alerts');
            });
            notificationList.appendChild(li);
        });
    }

    markAllReadBtn.addEventListener('click', () => {
        state.alerts.forEach(a => a.read = true);
        saveState('busgo_alerts', state.alerts);
        updateNotificationBell();
        showToast('Todas as notificações foram marcadas como lidas.', 'success');
    });

    // ==========================================================================
    // LOG DE OCORRÊNCIAS (PAINEL INFERIOR)
    // ==========================================================================
    
    function addLog(msg, tag = 'info') {
        const timeStr = new Date().toLocaleTimeString('pt-BR');
        const newLog = { time: timeStr, tag: tag, msg: msg };
        state.logs.unshift(newLog);
        
        // Limitar Logs
        if (state.logs.length > 50) {
            state.logs.pop();
        }
        
        saveState('busgo_logs', state.logs);
        
        if (state.activeTab === 'dashboard') {
            renderLogs();
        }
    }

    function renderLogs() {
        dashboardEventsLog.innerHTML = '';
        if (state.logs.length === 0) {
            dashboardEventsLog.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--color-muted)">Sem registros no momento.</div>`;
            return;
        }

        state.logs.forEach(log => {
            const row = document.createElement('div');
            row.className = `event-log-row ${log.tag}`;
            row.innerHTML = `
                <span class="event-time">${log.time}</span>
                <span class="event-tag ${log.tag}">${log.tag === 'info' ? 'informação' : (log.tag === 'critical' ? 'crítico' : log.tag)}</span>
                <span class="event-msg">${log.msg}</span>
            `;
            dashboardEventsLog.appendChild(row);
        });
    }

    btnClearLogs.addEventListener('click', () => {
        state.logs = [];
        saveState('busgo_logs', state.logs);
        renderLogs();
        showToast('Registro de eventos limpo com sucesso.', 'success');
    });

    // ==========================================================================
    // DESENHO E GERENCIAMENTO DO MAPA SVG INTERATIVO
    // ==========================================================================
    
    const svgBaseGridString = `
    <svg class="map-svg" viewBox="0 0 800 400" id="svg-map-canvas">
      <defs>
        <!-- Filtro para sombra dos ônibus -->
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.25"/>
        </filter>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(2, 11, 57, 0.02)" stroke-width="1"/>
        </pattern>
      </defs>
      
      <!-- Fundo quadriculado -->
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      <!-- Rio (Cartografia) -->
      <path d="M 620 0 Q 560 140, 630 260 T 570 400" fill="none" stroke="#D3E8FF" stroke-width="40" stroke-linecap="round"/>
      <path d="M 620 0 Q 560 140, 630 260 T 570 400" fill="none" stroke="#E1EFFF" stroke-width="20" stroke-linecap="round"/>
      
      <!-- Parques -->
      <rect x="60" y="30" width="140" height="70" rx="14" fill="#E2F5E5" />
      <rect x="420" y="270" width="130" height="80" rx="16" fill="#E2F5E5" />
      <rect x="260" y="60" width="100" height="50" rx="10" fill="#E2F5E5" />
      <rect x="680" y="310" width="90" height="60" rx="10" fill="#E2F5E5" />
      
      <!-- Linhas de Rua (Grid de Suporte) -->
      <g stroke="#ffffff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
        <line x1="50" y1="50" x2="750" y2="50"/>
        <line x1="50" y1="150" x2="750" y2="150"/>
        <line x1="50" y1="250" x2="750" y2="250"/>
        <line x1="50" y1="350" x2="750" y2="350"/>
        
        <line x1="100" y1="20" x2="100" y2="380"/>
        <line x1="300" y1="20" x2="300" y2="380"/>
        <line x1="500" y1="20" x2="500" y2="380"/>
        <line x1="700" y1="20" x2="700" y2="380"/>
      </g>
      
      <g stroke="#F2F3F7" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <line x1="50" y1="50" x2="750" y2="50"/>
        <line x1="50" y1="150" x2="750" y2="150"/>
        <line x1="50" y1="250" x2="750" y2="250"/>
        <line x1="50" y1="350" x2="750" y2="350"/>
        
        <line x1="100" y1="20" x2="100" y2="380"/>
        <line x1="300" y1="20" x2="300" y2="380"/>
        <line x1="500" y1="20" x2="500" y2="380"/>
        <line x1="700" y1="20" x2="700" y2="380"/>
      </g>

      <!-- Rotas Oficiais Desenhadas -->
      <path id="route-blue" d="M 100 50 L 300 50 L 300 150 L 700 150" fill="none" stroke="#0088ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.65"/>
      <path id="route-green" d="M 100 350 L 500 350 L 500 250 L 700 250" fill="none" stroke="#4CAF50" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.65"/>
      <path id="route-red" d="M 300 380 L 300 250 L 700 250" fill="none" stroke="#F44336" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.65"/>
      <path id="route-yellow" d="M 100 150 L 100 250 L 500 250 L 500 150 Z" fill="none" stroke="#FFC107" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.65"/>

      <!-- Grupo dos Marcadores de Ônibus -->
      <g id="bus-markers-group"></g>
    </svg>
    `;

    function initSVGMap(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = svgBaseGridString;
        
        // Ajustar zoom inicial do SVG
        const svgElement = container.querySelector('svg');
        if (svgElement && containerId === 'monitoring-large-map') {
            svgElement.style.transform = `scale(${currentMapZoom})`;
            svgElement.style.transformOrigin = 'center center';
            svgElement.style.transition = 'transform 0.3s ease';
        }
        
        updateMapMarkers();
    }

    function updateMapMarkers() {
        const activeContainerId = state.activeTab === 'dashboard' ? 'dashboard-map' : 'monitoring-large-map';
        const container = document.getElementById(activeContainerId);
        if (!container) return;
        
        const markersGroup = container.querySelector('#bus-markers-group');
        if (!markersGroup) return;

        // Limpar marcadores anteriores
        markersGroup.innerHTML = '';

        state.vehicles.forEach(vehicle => {
            if (vehicle.status !== 'Online') return;
            
            const routeInfo = routesData[vehicle.route];
            if (!routeInfo) return;

            const pathElement = container.querySelector(`#${routeInfo.svgPathId}`);
            if (!pathElement) return;

            try {
                // Cálculo de coordenada baseado no comprimento da linha
                const totalLength = pathElement.getTotalLength();
                const point = pathElement.getPointAtLength((vehicle.progress / 100) * totalLength);
                
                const markerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                markerG.setAttribute('class', `map-marker bus-${vehicle.id}`);
                markerG.setAttribute('transform', `translate(${point.x}, ${point.y})`);
                markerG.setAttribute('filter', 'url(#shadow)');

                // Legenda de cores
                const markerColor = routeInfo.color;

                markerG.innerHTML = `
                    <!-- Halo de onda pulsando -->
                    <circle cx="0" cy="0" r="10" fill="${markerColor}" opacity="0.3" class="map-marker-halo"></circle>
                    <!-- Corpo do marcador -->
                    <circle cx="0" cy="0" r="12" fill="${markerColor}" class="map-marker-pin" stroke="#ffffff" stroke-width="2.5"></circle>
                    <!-- Ícone ônibus ou Número -->
                    <text cx="0" cy="4" class="map-marker-text" font-size="9" fill="#ffffff" font-weight="700" text-anchor="middle" y="3">${vehicle.number}</text>
                    <!-- Tooltip básico de hover -->
                    <title>Ônibus ${vehicle.number} - ${vehicle.driver}\nVelocidade: ${vehicle.speed} km/h\nPassageiros: ${vehicle.occupancy}</title>
                `;

                // Clique no marcador (especialmente no mapa grande)
                markerG.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectBusOnMap(vehicle);
                });

                markersGroup.appendChild(markerG);
            } catch (err) {
                console.error("Falha ao calcular ponto na rota SVG do veículo " + vehicle.number, err);
            }
        });
    }

    // Lógica de Zoom e Centralização
    if (btnZoomIn) {
        btnZoomIn.addEventListener('click', () => {
            if (currentMapZoom < 2.5) {
                currentMapZoom += 0.25;
                applyMapZoom();
            }
        });
    }

    if (btnZoomOut) {
        btnZoomOut.addEventListener('click', () => {
            if (currentMapZoom > 0.75) {
                currentMapZoom -= 0.25;
                applyMapZoom();
            }
        });
    }

    if (btnRecenter) {
        btnRecenter.addEventListener('click', () => {
            currentMapZoom = 1;
            applyMapZoom();
        });
    }

    function applyMapZoom() {
        const svgElement = monitoringLargeMapContainer.querySelector('svg');
        if (svgElement) {
            svgElement.style.transform = `scale(${currentMapZoom})`;
        }
    }

    // Detalhar ônibus ao clicar no marcador
    function selectBusOnMap(vehicle) {
        state.selectedBusId = vehicle.id;
        
        // Highlight nas listas
        const cards = document.querySelectorAll('.bus-status-card');
        cards.forEach(card => {
            if (card.getAttribute('data-id') === vehicle.id) {
                card.style.borderColor = 'var(--color-dark)';
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                card.style.borderColor = '';
            }
        });

        // Mostrar painel flutuante
        const routeData = routesData[vehicle.route];
        selectedBusOverlay.innerHTML = `
            <div class="details-card-header">
                <div>
                    <span class="route-pill ${routeData.class}">${vehicle.route}</span>
                    <h3 style="margin-top: 0.4rem;">Veículo ${vehicle.number}</h3>
                </div>
                <button class="details-close-btn" id="btn-close-details-overlay">&times;</button>
            </div>
            <div class="details-grid">
                <p>Motorista <strong>${vehicle.driver}</strong></p>
                <p>Status <strong><span class="text-green">●</span> Online</strong></p>
                <p>Velocidade <strong>${vehicle.speed} km/h</strong></p>
                <p>Ocupação <strong>${vehicle.occupancy} alunos (${Math.round((vehicle.occupancy/vehicle.capacity)*100)}%)</strong></p>
                <p>Próxima Parada <strong>${vehicle.nextStop}</strong></p>
                <p>Previsto <strong>${new Date(Date.now() + 5*60000).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</strong></p>
            </div>
            <div class="details-actions">
                <button class="btn-secondary btn-sm" onclick="window.open('tel:${vehicle.phone}')"><i class="fa-solid fa-phone"></i> Ligar</button>
                <button class="btn-primary btn-sm" id="btn-re-route-quick"><i class="fa-solid fa-route"></i> Ver Rota</button>
            </div>
        `;
        selectedBusOverlay.classList.remove('hidden');

        // Handler para fechar detalhes
        document.getElementById('btn-close-details-overlay').addEventListener('click', () => {
            selectedBusOverlay.classList.add('hidden');
            state.selectedBusId = null;
        });

        // Rastrear histórico fictício
        document.getElementById('btn-re-route-quick').addEventListener('click', () => {
            showToast(`Exibindo histórico de paradas completadas para o Veículo ${vehicle.number}.`, 'info');
        });
    }

    // ==========================================================================
    // LISTAS DE ÔNIBUS ATIVOS (DASHBOARD & MONITORAMENTO)
    // ==========================================================================
    
    function updateActiveBusesList() {
        if (!dashboardActiveBusesList) return;
        
        dashboardActiveBusesList.innerHTML = '';
        
        const activeBuses = state.vehicles.filter(v => v.status === 'Online');
        activeBusesCountLabel.textContent = `${activeBuses.length} ativos`;

        if (activeBuses.length === 0) {
            dashboardActiveBusesList.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--color-muted)">Nenhum ônibus online no momento.</div>`;
            return;
        }

        activeBuses.forEach(vehicle => {
            const routeInfo = routesData[vehicle.route] || { color: '#000', class: 'blue' };
            const percentLoad = Math.round((vehicle.occupancy / vehicle.capacity) * 100);
            let loadClass = 'normal';
            if (percentLoad > 50) loadClass = 'warning';
            if (percentLoad > 85) loadClass = 'danger';

            const card = document.createElement('article');
            card.className = 'bus-status-card';
            card.setAttribute('data-id', vehicle.id);
            card.innerHTML = `
                <div class="bus-card-header">
                    <div class="bus-badge">
                        <span class="bus-num">#${vehicle.number}</span>
                        <span class="route-pill ${routeInfo.class}">${vehicle.route}</span>
                    </div>
                    <span class="status-badge online">Online</span>
                </div>
                
                <div class="bus-card-meta">
                    <div class="meta-item"><i class="fa-solid fa-id-card"></i> Condutor: <strong>${vehicle.driver}</strong></div>
                    <div class="meta-item"><i class="fa-solid fa-gauge"></i> Velocidade: <strong>${vehicle.speed} km/h</strong></div>
                    <div class="meta-item" style="grid-column: span 2;"><i class="fa-solid fa-location-dot"></i> Próxima parada: <strong>${vehicle.nextStop}</strong></div>
                </div>

                <div class="bus-card-occupancy">
                    <div class="occupancy-label-row">
                        <span>Lotação: ${vehicle.occupancy}/${vehicle.capacity} alunos</span>
                        <span>${percentLoad}%</span>
                    </div>
                    <div class="occupancy-bar-bg">
                        <div class="occupancy-bar-fill ${loadClass}" style="width: ${percentLoad}%"></div>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                switchTab('monitoring');
                setTimeout(() => {
                    const veh = state.vehicles.find(v => v.id === vehicle.id);
                    if (veh) selectBusOnMap(veh);
                }, 300);
            });

            dashboardActiveBusesList.appendChild(card);
        });
    }

    function updateMonitoringBusList() {
        if (!monitoringBusListEl) return;
        
        monitoringBusListEl.innerHTML = '';
        
        // Aplicar busca/filtro
        const query = monitoringSearchInput.value.toLowerCase();
        const filtered = state.vehicles.filter(v => {
            return v.number.toLowerCase().includes(query) || v.driver.toLowerCase().includes(query) || v.route.toLowerCase().includes(query);
        });

        if (filtered.length === 0) {
            monitoringBusListEl.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--color-muted)">Nenhum veículo corresponde à busca.</div>`;
            return;
        }

        filtered.forEach(vehicle => {
            const isOnline = vehicle.status === 'Online';
            const routeInfo = routesData[vehicle.route] || { color: '#000', class: 'blue' };
            const occupancyPct = isOnline ? Math.round((vehicle.occupancy / vehicle.capacity) * 100) : 0;
            const etaTime = isOnline ? new Date(Date.now() + 8*60000).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : '--:--';

            const card = document.createElement('div');
            card.className = 'bus-status-card';
            card.setAttribute('data-id', vehicle.id);
            if (state.selectedBusId === vehicle.id) {
                card.style.borderColor = 'var(--color-dark)';
            }
            card.innerHTML = `
                <div class="bus-card-header">
                    <div class="bus-badge">
                        <span class="bus-num">#${vehicle.number}</span>
                        <span class="route-pill ${routeInfo.class}">${vehicle.route}</span>
                    </div>
                    <span class="status-badge ${isOnline ? 'online' : 'offline'}">${vehicle.status}</span>
                </div>
                
                <div class="bus-card-meta">
                    <div class="meta-item"><i class="fa-solid fa-user"></i> Motorista: <strong>${vehicle.driver}</strong></div>
                    <div class="meta-item"><i class="fa-solid fa-graduation-cap"></i> Alunos: <strong>${vehicle.occupancy} embarcados</strong></div>
                    <div class="meta-item"><i class="fa-regular fa-clock"></i> Previsto: <strong>${etaTime}</strong></div>
                    <div class="meta-item"><i class="fa-solid fa-gauge"></i> Velocidade: <strong>${vehicle.speed} km/h</strong></div>
                </div>
                
                ${isOnline ? `
                <div class="bus-card-occupancy" style="margin-top:0.6rem;">
                    <div class="occupancy-bar-bg">
                        <div class="occupancy-bar-fill normal" style="width: ${occupancyPct}%"></div>
                    </div>
                </div>
                ` : ''}
            `;
            
            card.addEventListener('click', () => {
                if (isOnline) {
                    selectBusOnMap(vehicle);
                } else {
                    showToast(`O veículo ${vehicle.number} está offline. Não há coordenadas GPS ativas no momento.`, 'warning');
                }
            });

            monitoringBusListEl.appendChild(card);
        });
    }

    if (monitoringSearchInput) {
        monitoringSearchInput.addEventListener('input', () => {
            updateMonitoringBusList();
        });
    }

    // ==========================================================================
    // SIMULADOR GPS EM TEMPO REAL
    // ==========================================================================
    
    function runSimulationStep() {
        if (!state.simActive) return;

        let totalStudents = 0;
        let activeBuses = 0;

        state.vehicles.forEach(vehicle => {
            if (vehicle.status !== 'Online') return;
            
            activeBuses++;
            
            // Alterar velocidade aleatoriamente se em movimento
            if (vehicle.speed > 0) {
                vehicle.speed = Math.floor(Math.random() * (60 - 30 + 1)) + 30; // 30 a 60 km/h
            }

            // Incrementar progresso
            // A velocidade da simulação afeta o quanto de progresso o ônibus faz por passo
            const progressDelta = 0.8 + (Math.random() * 0.4); // 0.8% a 1.2% por ciclo
            vehicle.progress = (vehicle.progress + (progressDelta * vehicle.direction));

            // Checar limites
            if (vehicle.progress >= 100) {
                vehicle.progress = 100;
                vehicle.direction = -1; // dar a volta/retornar
                addLog(`Veículo <strong>${vehicle.number}</strong> alcançou o ponto final e iniciou o trajeto de retorno.`, 'info');
            } else if (vehicle.progress <= 0) {
                vehicle.progress = 0;
                vehicle.direction = 1; // retornar ao início
                addLog(`Veículo <strong>${vehicle.number}</strong> retornou ao ponto de partida e iniciou nova rota.`, 'info');
            }

            // Checar proximidade com as paradas da rota
            const routeInfo = routesData[vehicle.route];
            if (routeInfo) {
                routeInfo.stops.forEach(stop => {
                    const diff = Math.abs(vehicle.progress - stop.progress);
                    
                    // Se o veículo está bem próximo do ponto da parada e não está em resfriamento (cooldown)
                    // cooldown impede que ele trave no ponto indefinidamente
                    if (diff < 0.8 && vehicle.speed > 0 && !vehicle.isAtStopCooldown) {
                        // Parar ônibus
                        const originalSpeed = vehicle.speed;
                        vehicle.speed = 0;
                        vehicle.isAtStopCooldown = true;
                        vehicle.nextStop = getNextStopName(vehicle.route, stop.progress, vehicle.direction);
                        
                        // Gerar embarques / desembarques
                        let board = 0;
                        let alight = 0;
                        
                        if (vehicle.direction === 1) { // Indo para escola
                            // Mais embarques no início da rota, e desembarques no final
                            if (stop.progress > 70) {
                                alight = Math.min(vehicle.occupancy, Math.floor(Math.random() * 15) + 5);
                            } else {
                                board = Math.floor(Math.random() * (vehicle.capacity - vehicle.occupancy - 2 + 1)) + 2;
                            }
                        } else { // Retornando
                            // Alunos descendo em casa
                            alight = Math.min(vehicle.occupancy, Math.floor(Math.random() * 8) + 2);
                        }

                        vehicle.occupancy = Math.max(0, Math.min(vehicle.capacity, vehicle.occupancy + board - alight));

                        // Adicionar registro de parada
                        const stopLog = {
                            time: new Date().toLocaleTimeString('pt-BR'),
                            stop: stop.name,
                            vehicle: vehicle.number,
                            timeStopped: '45s',
                            boardings: board,
                            alightings: alight,
                            occupancy: vehicle.occupancy
                        };
                        state.reports.unshift(stopLog);
                        saveState('busgo_reports', state.reports);

                        addLog(`Veículo <strong>${vehicle.number}</strong> parou em: "${stop.name}". Embarques: +${board}, Desembarques: -${alight}.`, 'success');

                        // Retomar movimento após 3 segundos simulados
                        setTimeout(() => {
                            vehicle.speed = originalSpeed > 0 ? originalSpeed : 40;
                            // Remover trava de resfriamento após o ônibus se afastar do ponto
                            setTimeout(() => {
                                vehicle.isAtStopCooldown = false;
                            }, 5000);
                        }, 3000);
                    }
                });
            }

            totalStudents += vehicle.occupancy;
        });

        // Simulação de alertas aleatórios
        if (state.simAlertsActive && Math.random() < 0.07) { // 7% de chance por passo
            triggerRandomAlert();
        }

        // Salvar novos estados e atualizar interface
        saveState('busgo_vehicles', state.vehicles);
        
        // Atualizar visualizações das abas ativas
        updateKPIs(activeBuses, totalStudents);
        updateMapMarkers();

        if (state.activeTab === 'dashboard') {
            updateActiveBusesList();
        } else if (state.activeTab === 'monitoring') {
            updateMonitoringBusList();
            if (state.selectedBusId) {
                const selBus = state.vehicles.find(v => v.id === state.selectedBusId);
                if (selBus) selectBusOnMap(selBus);
            }
        } else if (state.activeTab === 'reports') {
            renderReportsTable();
            updateReportsIndicators();
        }
    }

    // Encontrar o nome da parada seguinte
    function getNextStopName(routeName, currentProgress, direction) {
        const route = routesData[routeName];
        if (!route) return 'Garagem';
        
        const sortedStops = [...route.stops].sort((a,b) => a.progress - b.progress);
        
        if (direction === 1) {
            const next = sortedStops.find(s => s.progress > currentProgress);
            return next ? next.name : 'Terminal Final';
        } else {
            const stopsRev = sortedStops.reverse();
            const next = stopsRev.find(s => s.progress < currentProgress);
            return next ? next.name : 'Terminal de Garagem';
        }
    }

    function triggerRandomAlert() {
        const onlineVehicles = state.vehicles.filter(v => v.status === 'Online');
        if (onlineVehicles.length === 0) return;

        const randBus = onlineVehicles[Math.floor(Math.random() * onlineVehicles.length)];
        const alertTypes = [
            {
                type: 'Desvio de Rota',
                severity: 'critical',
                msg: `Desvio de rota detectado para o veículo #${randBus.number}`,
                detail: `Distância desviada: ${(Math.random() * 1.5 + 0.5).toFixed(1)} km da linha de planejamento.`
            },
            {
                type: 'Parada não programada',
                severity: 'warning',
                msg: `Parada não programada para o veículo #${randBus.number}`,
                detail: `O veículo parou fora de pontos mapeados por mais de 2 minutos no GPS.`
            },
            {
                type: 'Atraso na rota',
                severity: 'warning',
                msg: `Possível atraso na Rota do veículo #${randBus.number}`,
                detail: `Engarrafamento na avenida principal projeta ${Math.floor(Math.random()*10 + 5)}min de atraso.`
            }
        ];

        const selectedAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const timeStr = new Date().toLocaleTimeString('pt-BR');

        const newAlert = {
            id: 'a_' + Date.now(),
            type: selectedAlert.type,
            severity: selectedAlert.severity,
            vehicle: randBus.number,
            driver: randBus.driver,
            time: timeStr,
            msg: selectedAlert.msg,
            detail: selectedAlert.detail,
            read: false
        };

        state.alerts.unshift(newAlert);
        saveState('busgo_alerts', state.alerts);
        
        updateNotificationBell();
        showToast(selectedAlert.msg, selectedAlert.severity);
        
        if (state.activeTab === 'alerts') {
            renderAlerts();
        }
    }

    function updateKPIs(activeBuses, totalStudents) {
        kpiBusVal.textContent = `${activeBuses} / ${state.vehicles.length}`;
        kpiStudentsVal.textContent = totalStudents;
    }

    // Iniciar Motor de Simulação
    let simulationTimer = setInterval(runSimulationStep, 2000); // Executa a cada 2s padrão

    function restartSimulationTimer() {
        clearInterval(simulationTimer);
        const intervalMs = (6 - state.simSpeed) * 1500; // velocidade 5 = 1.5s, velocidade 1 = 7.5s
        simulationTimer = setInterval(runSimulationStep, intervalMs);
        settingSimSpeedVal.textContent = `${(intervalMs/1000).toFixed(1)}s`;
    }

    // ==========================================================================
    // CRIAÇÃO E GERENCIAMENTO DE VEÍCULOS (CRUD)
    // ==========================================================================
    
    function renderVehiclesTable() {
        vehiclesTableBody.innerHTML = '';
        
        state.vehicles.forEach(vehicle => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${vehicle.number}</strong></td>
                <td>${vehicle.plate}</td>
                <td>${vehicle.model}</td>
                <td>${vehicle.year}</td>
                <td>${vehicle.capacity} alunos</td>
                <td>${vehicle.driver}</td>
                <td>
                    <span class="status-badge ${vehicle.status === 'Online' ? 'online' : 'offline'}">
                        ${vehicle.status}
                    </span>
                </td>
                <td class="actions-column">
                    <div class="actions-row">
                        <button class="btn-action-edit" data-id="${vehicle.id}" title="Editar veículo">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-action-delete" data-id="${vehicle.id}" title="Excluir veículo">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            `;

            // Vinculação de eventos para editar e deletar
            tr.querySelector('.btn-action-edit').addEventListener('click', () => openVehicleModal(vehicle));
            tr.querySelector('.btn-action-delete').addEventListener('click', () => deleteVehicle(vehicle.id));

            vehiclesTableBody.appendChild(tr);
        });

        // Preencher select de filtros da aba relatórios
        updateVehicleFilterSelect();
    }

    function updateVehicleFilterSelect() {
        if (!filterVehicleSelect) return;
        filterVehicleSelect.innerHTML = '<option value="">Todos os Veículos</option>';
        state.vehicles.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.number;
            opt.textContent = `Veículo ${v.number} - Placa ${v.plate}`;
            filterVehicleSelect.appendChild(opt);
        });
    }

    function openVehicleModal(vehicle = null) {
        vehicleModal.classList.remove('hidden');
        
        // Limpar erros de validação anteriores
        const errorWrappers = vehicleForm.querySelectorAll('.form-group');
        errorWrappers.forEach(w => w.classList.remove('has-error'));

        if (vehicle) {
            // Modo Edição
            modalTitle.textContent = `Editar Veículo #${vehicle.number}`;
            document.getElementById('vehicle-id-edit').value = vehicle.id;
            document.getElementById('modal-veh-number').value = vehicle.number;
            document.getElementById('modal-veh-number').setAttribute('disabled', 'true'); // impede alteração do número/chave primária
            document.getElementById('modal-veh-plate').value = vehicle.plate;
            document.getElementById('modal-veh-model').value = vehicle.model;
            document.getElementById('modal-veh-year').value = vehicle.year;
            document.getElementById('modal-veh-capacity').value = vehicle.capacity;
            document.getElementById('modal-veh-route').value = vehicle.route;
            document.getElementById('modal-veh-driver').value = vehicle.driver;
            document.getElementById('modal-veh-phone').value = vehicle.phone;
            document.getElementById('modal-veh-status').value = vehicle.status;
        } else {
            // Modo Cadastro
            modalTitle.textContent = "Cadastrar Novo Veículo";
            vehicleForm.reset();
            document.getElementById('vehicle-id-edit').value = '';
            document.getElementById('modal-veh-number').removeAttribute('disabled');
            document.getElementById('modal-veh-status').value = 'Online';
        }
    }

    function closeVehicleModal() {
        vehicleModal.classList.add('hidden');
    }

    btnAddVehicle.addEventListener('click', () => openVehicleModal());
    btnCloseModal.addEventListener('click', closeVehicleModal);
    btnCancelModal.addEventListener('click', closeVehicleModal);

    // Validação e Envio de Formulário de Cadastro/Edição
    vehicleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let isValid = true;
        const editId = document.getElementById('vehicle-id-edit').value;
        
        const numInput = document.getElementById('modal-veh-number');
        const plateInput = document.getElementById('modal-veh-plate');
        const modelInput = document.getElementById('modal-veh-model');
        const yearInput = document.getElementById('modal-veh-year');
        const capacityInput = document.getElementById('modal-veh-capacity');
        const routeSelect = document.getElementById('modal-veh-route');
        const driverInput = document.getElementById('modal-veh-driver');
        const phoneInput = document.getElementById('modal-veh-phone');
        const statusSelect = document.getElementById('modal-veh-status');

        // Regex Simples de Placa (Mercosul ou antiga)
        const plateRegex = /^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/i;

        // Validar Número do Veículo
        if (!numInput.value.trim() || isNaN(numInput.value)) {
            showInputError(numInput);
            isValid = false;
        } else {
            // Se for novo cadastro, verificar duplicidade do número
            if (!editId) {
                const dup = state.vehicles.find(v => v.number === numInput.value.trim());
                if (dup) {
                    showInputError(numInput, 'Número de veículo já cadastrado.');
                    isValid = false;
                } else {
                    clearInputError(numInput);
                }
            } else {
                clearInputError(numInput);
            }
        }

        // Validar Placa
        if (!plateRegex.test(plateInput.value.trim())) {
            showInputError(plateInput);
            isValid = false;
        } else {
            clearInputError(plateInput);
        }

        // Validar outros campos básicos
        if (!modelInput.value.trim()) { showInputError(modelInput); isValid = false; } else { clearInputError(modelInput); }
        
        const year = parseInt(yearInput.value);
        if (isNaN(year) || year < 1990 || year > 2027) { showInputError(yearInput); isValid = false; } else { clearInputError(yearInput); }
        
        const cap = parseInt(capacityInput.value);
        if (isNaN(cap) || cap < 10 || cap > 100) { showInputError(capacityInput); isValid = false; } else { clearInputError(capacityInput); }
        
        if (!routeSelect.value) { showInputError(routeSelect); isValid = false; } else { clearInputError(routeSelect); }
        if (!driverInput.value.trim()) { showInputError(driverInput); isValid = false; } else { clearInputError(driverInput); }
        if (!phoneInput.value.trim()) { showInputError(phoneInput); isValid = false; } else { clearInputError(phoneInput); }

        if (!isValid) return;

        // Se passar da validação, salvar
        if (editId) {
            // Atualizar
            const index = state.vehicles.findIndex(v => v.id === editId);
            if (index !== -1) {
                const oldStatus = state.vehicles[index].status;
                state.vehicles[index] = {
                    ...state.vehicles[index],
                    plate: plateInput.value.trim().toUpperCase(),
                    model: modelInput.value.trim(),
                    year: year,
                    capacity: cap,
                    route: routeSelect.value,
                    driver: driverInput.value.trim(),
                    phone: phoneInput.value.trim(),
                    status: statusSelect.value
                };

                // Tratar se mudou de offline para online
                if (oldStatus === 'Offline' && statusSelect.value === 'Online') {
                    state.vehicles[index].progress = 0;
                    state.vehicles[index].speed = 40;
                    addLog(`Veículo <strong>${state.vehicles[index].number}</strong> mudou para online no sistema.`, 'success');
                } else if (statusSelect.value === 'Offline') {
                    state.vehicles[index].speed = 0;
                }

                showToast(`Veículo ${numInput.value} atualizado com sucesso!`, 'success');
            }
        } else {
            // Criar Novo
            const newVeh = {
                id: 'v_' + Date.now(),
                number: numInput.value.trim(),
                plate: plateInput.value.trim().toUpperCase(),
                model: modelInput.value.trim(),
                year: year,
                capacity: cap,
                driver: driverInput.value.trim(),
                phone: phoneInput.value.trim(),
                route: routeSelect.value,
                status: statusSelect.value,
                speed: statusSelect.value === 'Online' ? 40 : 0,
                nextStop: 'Terminal de Partida',
                occupancy: 0,
                progress: 0,
                direction: 1
            };
            
            state.vehicles.push(newVeh);
            showToast(`Veículo ${numInput.value} cadastrado e integrado ao monitoramento!`, 'success');
            addLog(`Veículo <strong>${newVeh.number}</strong> foi adicionado ao sistema por Natalie.`, 'info');
        }

        saveState('busgo_vehicles', state.vehicles);
        renderVehiclesTable();
        closeVehicleModal();
    } );

    function deleteVehicle(id) {
        const bus = state.vehicles.find(v => v.id === id);
        if (!bus) return;

        if (confirm(`Tem certeza de que deseja remover permanentemente o Veículo #${bus.number} do sistema?`)) {
            state.vehicles = state.vehicles.filter(v => v.id !== id);
            saveState('busgo_vehicles', state.vehicles);
            renderVehiclesTable();
            showToast(`Veículo #${bus.number} excluído com sucesso.`, 'success');
            addLog(`Veículo <strong>${bus.number}</strong> foi removido do sistema por Natalie.`, 'warning');
        }
    }

    function showInputError(input, customMsg = null) {
        const formGroup = input.closest('.form-group');
        formGroup.classList.add('has-error');
        if (customMsg) {
            formGroup.querySelector('.form-error-msg').textContent = customMsg;
        }
    }

    function clearInputError(input) {
        const formGroup = input.closest('.form-group');
        formGroup.classList.remove('has-error');
    }

    // ==========================================================================
    // RELATÓRIO DE PARADAS E FILTROS (PÁGINA 4)
    // ==========================================================================
    
    function renderReportsTable(filteredReports = null) {
        if (!reportsTableBody) return;
        reportsTableBody.innerHTML = '';
        
        const reportsToShow = filteredReports || state.reports;

        if (reportsToShow.length === 0) {
            reportsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: var(--color-muted); padding: 3rem;">
                        Nenhuma parada encontrada para os filtros aplicados.
                    </td>
                </tr>
            `;
            return;
        }

        reportsToShow.forEach(rep => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${rep.time}</td>
                <td><strong>${rep.stop}</strong></td>
                <td>Veículo #${rep.vehicle}</td>
                <td>${rep.timeStopped}</td>
                <td><span class="text-green">+${rep.boardings}</span></td>
                <td><span class="text-danger">-${rep.alightings}</span></td>
                <td><strong>${rep.occupancy} alunos</strong></td>
            `;
            reportsTableBody.appendChild(tr);
        });
    }

    function updateReportsIndicators() {
        reportTotalStopsLabel.textContent = state.reports.length;
        
        // Calcular atrasos fictícios
        const delays = state.alerts.filter(a => a.type === 'Atraso na Rota').length;
        reportDelaysCountLabel.textContent = delays;
    }

    btnApplyFilters.addEventListener('click', () => {
        const dateVal = filterDateInput.value;
        const vehVal = filterVehicleSelect.value;
        const driverVal = filterDriverInput.value.toLowerCase();
        const routeVal = filterRouteSelect.value;

        // Filtrar a partir do array reports original
        const filtered = state.reports.filter(rep => {
            // Filtro veículo
            if (vehVal && rep.vehicle !== vehVal) return false;
            
            // Filtro Rota e Motorista requerem busca no objeto do veículo correspondente
            const vObj = state.vehicles.find(v => v.number === rep.vehicle);
            if (vObj) {
                if (driverVal && !vObj.driver.toLowerCase().includes(driverVal)) return false;
                if (routeVal && vObj.route !== routeVal) return false;
            } else {
                // Se o veículo foi deletado e não achou cadastro ativo
                if (driverVal || routeVal) return false;
            }
            
            return true;
        });

        renderReportsTable(filtered);
        showToast(`Filtros aplicados. ${filtered.length} paradas encontradas.`, 'success');
    });

    btnResetFilters.addEventListener('click', () => {
        filterVehicleSelect.value = '';
        filterDriverInput.value = '';
        filterRouteSelect.value = '';
        filterDateInput.value = new Date().toISOString().split('T')[0];
        
        renderReportsTable(state.reports);
        showToast('Filtros do relatório limpos.', 'info');
    });

    // ==========================================================================
    // CENTRAL DE ALERTAS (PÁGINA 5)
    // ==========================================================================
    
    function renderAlerts(filterSeverity = 'all') {
        if (!alertsCardsContainer) return;
        alertsCardsContainer.innerHTML = '';

        let filtered = state.alerts;
        if (filterSeverity !== 'all') {
            filtered = state.alerts.filter(a => a.severity === filterSeverity);
        }

        if (filtered.length === 0) {
            alertsCardsContainer.innerHTML = `
                <div style="grid-column: span 3; text-align: center; padding: 4rem; color: var(--color-muted)">
                    Nenhum alerta registrado sob esta categoria.
                </div>
            `;
            return;
        }

        filtered.forEach(alert => {
            const card = document.createElement('article');
            card.className = `alert-card ${alert.severity}`;
            card.innerHTML = `
                <div class="alert-card-header">
                    <span class="alert-type-badge">${alert.type}</span>
                    <span class="alert-time-label">${alert.time}</span>
                </div>
                <div class="alert-card-body">
                    <h3>${alert.msg}</h3>
                    <div class="alert-card-details">
                        <span class="alert-detail-item">Veículo: <strong>#${alert.vehicle}</strong></span>
                        <span class="alert-detail-item">Motorista: <strong>${alert.driver}</strong></span>
                        <span class="alert-detail-item" style="margin-top: 0.6rem; font-size:1.2rem;">${alert.detail}</span>
                    </div>
                </div>
                <div class="alert-card-footer">
                    <button class="btn-secondary btn-sm btn-resolve-alert" data-id="${alert.id}">Resolver Ocorrência</button>
                </div>
            `;

            card.querySelector('.btn-resolve-alert').addEventListener('click', () => resolveAlert(alert.id));
            alertsCardsContainer.appendChild(card);
        });
    }

    function resolveAlert(id) {
        state.alerts = state.alerts.filter(a => a.id !== id);
        saveState('busgo_alerts', state.alerts);
        updateNotificationBell();
        
        const activeSeverity = document.querySelector('.alert-filter-btn.active').getAttribute('data-severity');
        renderAlerts(activeSeverity);
        
        showToast('Ocorrência resolvida e arquivada com sucesso.', 'success');
        addLog(`Alerta operacional com protocolo #${id.split('_')[1] || id} foi finalizado por Natalie.`, 'success');
    }

    alertFilterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            alertFilterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const severity = btn.getAttribute('data-severity');
            renderAlerts(severity);
        });
    });

    // ==========================================================================
    // CAMPO DE BUSCA GLOBAL (HEADER)
    // ==========================================================================
    
    globalSearchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim().toLowerCase();
        if (!val) {
            searchDropdown.classList.add('hidden');
            return;
        }

        // Buscar veículos, motoristas ou rotas
        const results = state.vehicles.filter(v => {
            return v.number.includes(val) || v.driver.toLowerCase().includes(val) || v.route.toLowerCase().includes(val);
        });

        searchDropdown.innerHTML = '';

        if (results.length === 0) {
            searchDropdown.innerHTML = `<div style="padding: 1.2rem; text-align: center; color: var(--color-muted); font-size:1.3rem;">Sem correspondências</div>`;
            searchDropdown.classList.remove('hidden');
            return;
        }

        results.forEach(res => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `
                <i class="fa-solid fa-bus"></i>
                <div class="search-result-info">
                    <span class="search-result-title">Veículo #${res.number} (${res.driver})</span>
                    <span class="search-result-sub">${res.route} • Status: ${res.status}</span>
                </div>
            `;
            
            div.addEventListener('click', () => {
                globalSearchInput.value = '';
                searchDropdown.classList.add('hidden');
                
                if (res.status === 'Online') {
                    switchTab('monitoring');
                    setTimeout(() => {
                        selectBusOnMap(res);
                    }, 300);
                } else {
                    switchTab('vehicles');
                    showToast(`O veículo ${res.number} está offline. Redirecionando para a tabela de gestão.`, 'warning');
                }
            });

            searchDropdown.appendChild(div);
        });

        searchDropdown.classList.remove('hidden');
    });

    // Fechar dropdown de busca ao clicar fora
    document.addEventListener('click', (e) => {
        if (!searchDropdown.contains(e.target) && e.target !== globalSearchInput) {
            searchDropdown.classList.add('hidden');
        }
    });

    // ==========================================================================
    // CONFIGURAÇÕES DO PAINEL (ABAS E FORMULÁRIOS)
    // ==========================================================================
    
    // Alternância de sub-abas nas configurações
    settingsMenuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            settingsMenuButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const targetSet = btn.getAttribute('data-set');
            settingsPanelContents.forEach(panel => {
                if (panel.getAttribute('id') === `setting-panel-${targetSet}`) {
                    panel.classList.remove('hidden');
                    panel.classList.add('active');
                } else {
                    panel.classList.add('hidden');
                    panel.classList.remove('active');
                }
            });
        });
    });

    // Configurar Valores Padrão das Configurações no DOM
    function loadSettingsToDOM() {
        settingSimActive.checked = state.simActive;
        settingSimSpeed.value = state.simSpeed;
        settingSimSpeedVal.textContent = `${( (6 - state.simSpeed) * 1.5 ).toFixed(1)}s`;
        settingSimAlerts.checked = state.simAlertsActive;
        settingSoundAlerts.checked = state.soundEnabled;
        settingPushAlerts.checked = state.pushEnabled;
        settingAutoClear.checked = state.autoClearLogs;
    }

    // Salvar Ajustes do Simulador
    btnSaveSimSettings.addEventListener('click', () => {
        state.simActive = settingSimActive.checked;
        state.simSpeed = parseInt(settingSimSpeed.value);
        state.simAlertsActive = settingSimAlerts.checked;

        restartSimulationTimer();
        showToast('Configurações do Simulador GPS atualizadas com sucesso.', 'success');
        addLog(`Ajustes da simulação alterados (Velocidade: Nível ${state.simSpeed}).`, 'info');
    });

    settingSimSpeed.addEventListener('input', (e) => {
        const spd = parseInt(e.target.value);
        settingSimSpeedVal.textContent = `${( (6 - spd) * 1.5 ).toFixed(1)}s`;
    });

    // Salvar Ajustes de Notificações
    btnSaveNotificationSettings.addEventListener('click', () => {
        state.soundEnabled = settingSoundAlerts.checked;
        state.pushEnabled = settingPushAlerts.checked;
        state.autoClearLogs = settingAutoClear.checked;

        // Simular push ask
        if (state.pushEnabled && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        showToast('Preferências de notificação e alertas salvas.', 'success');
    });

    // Salvar Ajustes do Perfil
    btnSaveProfileSettings.addEventListener('click', () => {
        const nameVal = profileNameInput.value.trim();
        const emailVal = profileEmailInput.value.trim();
        
        if (!nameVal || !emailVal) {
            showToast('Nome e E-mail são obrigatórios para o perfil.', 'error');
            return;
        }

        document.querySelector('.user-name').textContent = nameVal;
        document.getElementById('header-greeting-title').textContent = `Olá, ${nameVal.split(' ')[0]}`;
        
        showToast('Perfil do Administrador atualizado com sucesso.', 'success');
        addLog('Dados de perfil do administrador atualizados.', 'info');
    });

    // Alterar imagem fictícia do avatar
    document.getElementById('btn-change-avatar').addEventListener('click', () => {
        const url = prompt("Insira a URL de uma imagem para o novo avatar (ou cancele):", "https://i.pravatar.cc/100?img=32");
        if (url) {
            document.querySelector('.profile-avatar').src = url;
            document.querySelector('.avatar-img').src = url;
            document.getElementById('settings-avatar-preview').src = url;
            showToast('Imagem de perfil atualizada com sucesso!', 'success');
        }
    });

    // ==========================================================================
    // START
    // ==========================================================================
    
    initLocalStorage();
    loadSettingsToDOM();
    updateNotificationBell();
    restartSimulationTimer(); // Inicia com base na velocidade padrão do DOM

    // Injeção inicial do mapa principal do Dashboard
    initSVGMap('dashboard-map');
    updateActiveBusesList();
    renderLogs();

});
