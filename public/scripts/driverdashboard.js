/**
 * CONTROLADOR DO MÓDULO DO MOTORISTA — BUSWAITER
 * Lógica do mapa Leaflet, simulação de trajeto, registro de paradas tátil,
 * chat com a central de controle e finalização de turno.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================================================
    // ESTADO DO MOTORISTA E DA ROTA ACTIVE
    // ==========================================================================
    
    let state = {
        gpsOnline: true,
        currentSpeed: 35, // km/h
        currentProgress: 35, // % da rota
        routeDirection: 1, // 1 = indo, -1 = voltando
        simActive: true,
        
        // Rotas atribuídas
        routes: [
            { id: 'r1', code: 'Rota 01', title: 'Sentido Centro → Quartel', plate: 'UBB-1254', status: 'Em andamento', time: 'Início 5:20h', active: true },
            { id: 'r2', code: 'Rota 02', title: 'Sentido Centro → Quartel', plate: 'UBB-1254', status: 'Aguardando início', time: 'Início -:-h', active: false },
            { id: 'r3', code: 'Rota 03', title: 'Terminal → Shopping Integrador', plate: 'UBB-1254', status: 'Aguardando início', time: 'Início -:-h', active: false }
        ],

        // Paradas da Rota Ativa
        stops: [
            { name: 'Terminal de Partida', lat: -8.0582, lng: -34.8721, status: 'completed', index: 1 },
            { name: 'Ponto da Avenida Central', lat: -8.0551, lng: -34.8785, status: 'completed', index: 2 },
            { name: 'Praça dos Estudantes', lat: -8.0505, lng: -34.8848, status: 'next', index: 3 },
            { name: 'Hospital Metropolitano', lat: -8.0468, lng: -34.8920, status: 'pending', index: 4 },
            { name: 'Escola Santa Cecília', lat: -8.0418, lng: -34.8975, status: 'pending', index: 5 },
            { name: 'Quartel Geral (Final)', lat: -8.0375, lng: -34.9030, status: 'pending', index: 6 }
        ],

        // Mensagens do Chat
        messages: [
            { time: '05:22', sender: 'central', text: 'Bom dia, João. Inicie a rota com cautela. Chuva moderada na área central.' },
            { time: '05:25', sender: 'driver', text: 'Bom dia! Rota 01 iniciada no horário previsto.' },
            { time: '05:40', sender: 'central', text: 'Alerta: Ponto da Avenida Central com fluxo lento devido a obras.' }
        ],

        busLatLng: [-8.0551, -34.8785], // Começa no ponto 2
        busMarker: null,
        routePolyline: null,
        leafletStopsMarkers: [],
        map: null
    };

    // Preencher as estatísticas iniciais da Rota
    const totalStopsCount = state.stops.length;
    let completedStopsCount = state.stops.filter(s => s.status === 'completed').length;
    let currentNextStopIndex = state.stops.findIndex(s => s.status === 'next');

    // ==========================================================================
    // ELEMENTOS DO DOM
    // ==========================================================================
    
    // Header Widgets
    const currentSpeedEl = document.getElementById('current-speed');
    const currentSpeedMobileEl = document.getElementById('current-speed-mobile');
    const gpsDot = document.getElementById('gps-dot');
    const gpsText = document.getElementById('gps-text');

    // Next Stop Info Card
    const nextStopNameEl = document.getElementById('next-stop-name');
    const nextStopEtaEl = document.getElementById('next-stop-eta');
    const nextStopDistEl = document.getElementById('next-stop-dist');
    const routeProgressLabel = document.getElementById('route-progress-label');
    const routeProgressPercent = document.getElementById('route-progress-percent');
    const routeProgressBar = document.getElementById('route-progress-bar');

    // Layout Drawers (Mobile Toggle)
    const routesPanel = document.getElementById('routes-panel');
    const chatPanel = document.getElementById('chat-panel');
    const btnToggleRoutes = document.getElementById('btn-toggle-routes');
    const btnToggleChat = document.getElementById('btn-toggle-chat');
    const routesCloseBtn = document.getElementById('routes-close-btn');
    const chatCloseBtn = document.getElementById('chat-close-btn');
    const chatBadgeMobile = document.getElementById('chat-badge-mobile');

    // Modais
    const btnRegisterStop = document.getElementById('btn-register-stop');
    const btnEndShift = document.getElementById('btn-end-shift');
    const stopModal = document.getElementById('stop-modal');
    const shiftModal = document.getElementById('shift-modal');
    
    const btnCloseStopModal = document.getElementById('btn-close-stop-modal');
    const btnCancelStopModal = document.getElementById('btn-cancel-stop-modal');
    const btnCloseShiftModal = document.getElementById('btn-close-shift-modal');
    const btnCancelShiftModal = document.getElementById('btn-cancel-shift-modal');
    const btnConfirmShiftModal = document.getElementById('btn-confirm-shift-modal');
    
    const stopForm = document.getElementById('stop-form');
    const modalStopName = document.getElementById('modal-stop-name');

    // Chat
    const chatHistory = document.getElementById('chat-history');
    const chatMessageInput = document.getElementById('chat-message-input');
    const chatInputForm = document.getElementById('chat-input-form');
    const quickReportButtons = document.querySelectorAll('.btn-quick-report');
    
    // Toast Container
    const toastContainer = document.getElementById('toast-container');

    // ==========================================================================
    // TOASTS OPERACIONAIS
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

        toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());

        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    }

    // ==========================================================================
    // INICIALIZAÇÃO E CONTROLE DOS DRAWERS RESPONSIVOS
    // ==========================================================================
    
    function closeAllDrawers() {
        routesPanel.classList.remove('open');
        chatPanel.classList.remove('open');
    }

    btnToggleRoutes.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = routesPanel.classList.contains('open');
        closeAllDrawers();
        if (!isOpen) routesPanel.classList.add('open');
    });

    btnToggleChat.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = chatPanel.classList.contains('open');
        closeAllDrawers();
        if (!isOpen) {
            chatPanel.classList.add('open');
            chatBadgeMobile.classList.add('hidden'); // Limpa indicador de nova mensagem
        }
    });

    routesCloseBtn.addEventListener('click', closeAllDrawers);
    chatCloseBtn.addEventListener('click', closeAllDrawers);

    // Fechar ao clicar no mapa no mobile
    document.querySelector('.map-viewport').addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            closeAllDrawers();
        }
    });

    // Evitar fechamento ao clicar dentro dos painéis
    routesPanel.addEventListener('click', (e) => e.stopPropagation());
    chatPanel.addEventListener('click', (e) => e.stopPropagation());

    // ==========================================================================
    // RENDERIZADORES DE ROTA E HISTÓRICO
    // ==========================================================================
    
    function renderRoutesList() {
        const container = document.getElementById('routes-list-container');
        if (!container) return;
        container.innerHTML = '';

        state.routes.forEach(route => {
            const card = document.createElement('div');
            card.className = `driver-route-card ${route.active ? 'active' : 'inactive'}`;
            card.innerHTML = `
                <div class="route-title">
                    <h3>${route.title}</h3>
                </div>
                <div class="route-meta-row">
                    <span>Código: <strong>${route.code}</strong></span>
                    <span>Placa: <strong>${route.plate}</strong></span>
                </div>
                <div class="route-footer-row">
                    <span class="route-status-pill ${route.status === 'Em andamento' ? 'active' : (route.status === 'Pausada' ? 'paused' : 'waiting')}">
                        ${route.status}
                    </span>
                    <span class="route-time-badge">${route.time}</span>
                </div>
            `;

            // Permite alternar rota ativa (apenas se não estiver ativa)
            card.addEventListener('click', () => {
                if (!route.active && route.status !== 'Finalizada') {
                    if (confirm(`Deseja carregar a rota "${route.title} (${route.code})"?`)) {
                        state.routes.forEach(r => r.active = false);
                        route.active = true;
                        route.status = 'Em andamento';
                        route.time = 'Início ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) + 'h';
                        
                        showToast(`Carregando rota: ${route.code}`, 'success');
                        
                        // Reiniciar progresso e simulação para a rota
                        state.currentProgress = 20; // reset inicial
                        resetActiveRouteSimulation();
                    }
                }
            });

            container.appendChild(card);
        });
    }

    // Resetar simulação ao mudar de rota
    function resetActiveRouteSimulation() {
        state.stops.forEach((s, idx) => {
            if (idx < 2) s.status = 'completed';
            else if (idx === 2) s.status = 'next';
            else s.status = 'pending';
        });

        completedStopsCount = state.stops.filter(s => s.status === 'completed').length;
        currentNextStopIndex = state.stops.findIndex(s => s.status === 'next');
        state.busLatLng = [state.stops[1].lat, state.stops[1].lng];
        
        renderRoutesList();
        updateStopIndicators();
        drawStopsOnMap();
        
        if (state.busMarker) {
            state.busMarker.setLatLng(state.busLatLng);
            state.map.setView(state.busLatLng, 14);
        }
    }

    // ==========================================================================
    // MAPA LEAFLET E DESENHO DE PONTOS/MARKERS
    // ==========================================================================
    
    function initLeafletMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        // Centrado inicial no ponto 2
        state.map = L.map('map', { 
            zoomControl: false, 
            attributionControl: false 
        }).setView(state.busLatLng, 14);

        // Adicionar zoom control na ponta direita inferior
        L.control.zoom({ position: 'bottomright' }).addTo(state.map);

        // Tiles OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18
        }).addTo(state.map);

        // Desenhar Rota Polilinha (Verde Destaque)
        const pathCoords = state.stops.map(s => [s.lat, s.lng]);
        state.routePolyline = L.polyline(pathCoords, {
            color: '#4CAF50',
            weight: 6,
            opacity: 0.85,
            lineJoin: 'round'
        }).addTo(state.map);

        // Adicionar paradas no mapa
        drawStopsOnMap();

        // Adicionar marcador do Ônibus com Halo Pulsante
        const busIcon = L.divIcon({
            html: `
                <div class="marker-pin-bus-halo"></div>
                <div class="marker-pin-bus">
                    <i class="fa-solid fa-bus"></i>
                </div>
            `,
            className: 'custom-leaflet-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        state.busMarker = L.marker(state.busLatLng, { icon: busIcon }).addTo(state.map);
        state.busMarker.bindPopup('<strong>Veículo UBB-1254</strong><br>Motorista: João Flavio').openPopup();
    }

    function drawStopsOnMap() {
        // Remover marcadores anteriores
        state.leafletStopsMarkers.forEach(m => state.map.removeLayer(m));
        state.leafletStopsMarkers = [];

        state.stops.forEach((stop) => {
            let statusClass = 'pending';
            if (stop.status === 'completed') statusClass = 'completed';
            if (stop.status === 'next') statusClass = 'next';

            const stopIcon = L.divIcon({
                html: `<div class="marker-pin-stop ${statusClass}">${stop.index}</div>`,
                className: 'custom-leaflet-marker',
                iconSize: stop.status === 'next' ? [28, 28] : [22, 22],
                iconAnchor: stop.status === 'next' ? [14, 14] : [11, 11]
            });

            const marker = L.marker([stop.lat, stop.lng], { icon: stopIcon }).addTo(state.map);
            marker.bindPopup(`<strong>Parada ${stop.index}</strong>: ${stop.name}<br>Status: ${stop.status === 'next' ? 'Próxima Parada' : (stop.status === 'completed' ? 'Concluída' : 'Pendente')}`);
            
            // Zoom e foco ao clicar na parada
            marker.on('click', () => {
                state.map.setView([stop.lat, stop.lng], 15);
            });

            state.leafletStopsMarkers.push(marker);
        });
    }

    // ==========================================================================
    // SIMULADOR DE MOVIMENTO GPS E VELOCIDADE
    // ==========================================================================
    
    function runGPSMovement() {
        if (!state.simActive || !state.gpsOnline) return;

        // Se houver uma próxima parada definida
        if (currentNextStopIndex !== -1 && currentNextStopIndex < state.stops.length) {
            const nextStop = state.stops[currentNextStopIndex];
            const prevStop = state.stops[currentNextStopIndex - 1] || state.stops[0];
            
            // Andar gradualmente em direção ao ponto de latitude e longitude
            const speedFact = 0.05; // Fator de progresso por passo
            
            // Lógica simples de interpolação linear
            const latDiff = nextStop.lat - state.busLatLng[0];
            const lngDiff = nextStop.lng - state.busLatLng[1];
            
            // Distância Euclidiana aproximada
            const distance = Math.sqrt(latDiff*latDiff + lngDiff*lngDiff);
            
            if (distance > 0.0004) {
                // Ônibus em movimento
                state.busLatLng = [
                    state.busLatLng[0] + latDiff * speedFact,
                    state.busLatLng[1] + lngDiff * speedFact
                ];
                
                // Variar velocidade
                state.currentSpeed = Math.floor(Math.random() * (45 - 32 + 1)) + 32;
                
                // Calcular ETA fictício em minutos baseado na distância
                const etaMin = Math.max(1, Math.round(distance * 350));
                const distKm = (distance * 111).toFixed(1); // 1 grau ~ 111km
                
                nextStopEtaEl.textContent = `${etaMin} min`;
                nextStopDistEl.textContent = `${distKm} km`;
            } else {
                // Chegou na Parada! Velocidade cai
                state.currentSpeed = 0;
                state.busLatLng = [nextStop.lat, nextStop.lng];
                
                nextStopEtaEl.textContent = `Chegou`;
                nextStopDistEl.textContent = `0.0 km`;
                
                // Alertar motorista apenas uma vez por parada
                if (!nextStop.alertedArrival) {
                    nextStop.alertedArrival = true;
                    showToast(`Você chegou em: "${nextStop.name}". Registre a parada!`, 'warning');
                    addChatMessage('central', `Veículo UBB-1254 chegou ao ponto: ${nextStop.name}. Aguardando registro de fluxo.`);
                    
                    // Abrir automaticamente o modal para facilitar a vida do motorista
                    setTimeout(() => {
                        if (state.simActive && state.gpsOnline) {
                            openStopModal();
                        }
                    }, 1000);
                }
            }
            
            // Atualizar velocímetro na tela
            currentSpeedEl.innerHTML = `${state.currentSpeed} <small>km/h</small>`;
            currentSpeedMobileEl.textContent = state.currentSpeed;

            // Mover marcador no mapa
            if (state.busMarker) {
                state.busMarker.setLatLng(state.busLatLng);
            }
        }
    }

    // Roda o simulador de movimento a cada 1.5 segundos
    setInterval(runGPSMovement, 1500);

    // ==========================================================================
    // MODAIS OPERACIONAIS E STEPPERS TÁTEIS
    // ==========================================================================
    
    // Controles Stepper (+ e -) nos modais
    document.querySelectorAll('.btn-stepper').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-action');
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;

            let val = parseInt(input.value) || 0;
            if (action === 'plus') {
                val = Math.min(input.max, val + 1);
            } else if (action === 'minus') {
                val = Math.max(input.min, val - 1);
            }
            input.value = val;
        });
    });

    // Modal de Parada
    function openStopModal() {
        // Obter nome da próxima parada
        if (currentNextStopIndex !== -1 && currentNextStopIndex < state.stops.length) {
            modalStopName.textContent = state.stops[currentNextStopIndex].name;
            stopModal.classList.remove('hidden');
            
            // Resetar contadores
            document.getElementById('stop-boardings').value = 0;
            document.getElementById('stop-alightings').value = 0;
            document.getElementById('stop-notes').value = '';
        } else {
            showToast('Nenhuma parada pendente na rota atual.', 'info');
        }
    }

    function closeStopModal() {
        stopModal.classList.add('hidden');
    }

    btnRegisterStop.addEventListener('click', openStopModal);
    btnCloseStopModal.addEventListener('click', closeStopModal);
    btnCancelStopModal.addEventListener('click', closeStopModal);

    // Confirmação de Parada
    stopForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const board = parseInt(document.getElementById('stop-boardings').value) || 0;
        const alight = parseInt(document.getElementById('stop-alightings').value) || 0;
        const notes = document.getElementById('stop-notes').value.trim();

        if (currentNextStopIndex !== -1 && currentNextStopIndex < state.stops.length) {
            const currentStop = state.stops[currentNextStopIndex];
            
            // Marcar atual como concluída
            currentStop.status = 'completed';
            
            // Atualizar indicadores
            completedStopsCount = state.stops.filter(s => s.status === 'completed').length;
            
            // Avançar para próxima parada
            currentNextStopIndex++;
            if (currentNextStopIndex < state.stops.length) {
                state.stops[currentNextStopIndex].status = 'next';
            } else {
                // Fim da rota
                state.simActive = false;
                state.routes[0].status = 'Finalizada';
                renderRoutesList();
                showToast('Rota finalizada com sucesso!', 'success');
                addChatMessage('central', 'Turno de rota concluído. Central agradece a viagem.');
            }

            updateStopIndicators();
            drawStopsOnMap();
            closeStopModal();
            
            // Logar no chat com a Central
            let chatText = `Registrou parada no ponto: *${currentStop.name}* (Embarques: +${board}, Desembarques: -${alight})`;
            if (notes) chatText += ` • Obs: "${notes}"`;
            addChatMessage('driver', chatText);

            showToast('Parada registrada com sucesso!', 'success');
            
            // Resposta automática da Central
            setTimeout(() => {
                addChatMessage('central', `Recebido. Registro do Ponto ${currentStop.index} processado no banco de logística.`);
            }, 2000);
        }
    });

    function updateStopIndicators() {
        const nextStop = state.stops.find(s => s.status === 'next') || state.stops[state.stops.length - 1];
        nextStopNameEl.textContent = nextStop.name;
        
        // Progress Bar
        routeProgressLabel.textContent = `${completedStopsCount} / ${totalStopsCount} paradas concluídas`;
        const percent = Math.round((completedStopsCount / totalStopsCount) * 100);
        routeProgressPercent.textContent = `${percent}%`;
        routeProgressBar.style.width = `${percent}%`;
    }

    // Modal de Encerramento de Turno
    function openShiftModal() {
        shiftModal.classList.remove('hidden');
    }

    function closeShiftModal() {
        shiftModal.classList.add('hidden');
    }

    btnEndShift.addEventListener('click', openShiftModal);
    btnCloseShiftModal.addEventListener('click', closeShiftModal);
    btnCancelShiftModal.addEventListener('click', closeShiftModal);

    btnConfirmShiftModal.addEventListener('click', () => {
        // Encerrar turno operacional
        state.simActive = false;
        state.gpsOnline = false;
        state.currentSpeed = 0;
        
        // Atualizar interface
        gpsDot.className = 'gps-dot offline';
        gpsText.textContent = 'GPS Offline';
        currentSpeedEl.innerHTML = `0 <small>km/h</small>`;
        currentSpeedMobileEl.textContent = '0';
        
        state.routes.forEach(r => {
            if (r.active) {
                r.status = 'Finalizada';
                r.active = false;
            }
        });
        
        renderRoutesList();
        closeShiftModal();
        
        addChatMessage('driver', 'Solicitação de encerramento de turno de trabalho enviada.');
        showToast('Turno operacional encerrado. Bom descanso!', 'error');

        setTimeout(() => {
            addChatMessage('central', 'Turno finalizado no sistema. Veículo UBB-1254 desconectado das rotas escolares de hoje.');
        }, 1500);
    });

    // ==========================================================================
    // SISTEMA DE CHAT & RELATOS OPERACIONAIS
    // ==========================================================================
    
    function renderChatHistory() {
        chatHistory.innerHTML = '';
        state.messages.forEach(msg => {
            const div = document.createElement('div');
            div.className = `chat-bubble ${msg.sender}`;
            div.innerHTML = `
                <span>${msg.text}</span>
                <span class="chat-meta">${msg.time}</span>
            `;
            chatHistory.appendChild(div);
        });

        // Scroll suave para o final do chat
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function addChatMessage(sender, text) {
        const timeStr = new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
        state.messages.push({
            time: timeStr,
            sender: sender,
            text: text
        });

        renderChatHistory();

        // Se o chat estiver fechado no mobile, piscar badge
        if (window.innerWidth <= 768 && !chatPanel.classList.contains('open') && sender === 'central') {
            chatBadgeMobile.classList.remove('hidden');
        }
    }

    // Formulário de Envio Manual
    chatInputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msgText = chatMessageInput.value.trim();
        if (!msgText) return;

        addChatMessage('driver', msgText);
        chatMessageInput.value = '';

        // Resposta randômica de suporte da Central
        setTimeout(() => {
            const centralReplies = [
                "Ciente, motorista João Flavio. Ocorrência repassada para o supervisor da área.",
                "Entendido. Coordenadas de tráfego atualizadas. Prossiga com segurança.",
                "Recebido João. Estamos acompanhando seu trajeto via satélite.",
                "Agradecemos o reporte. Rastreamento mantido normal."
            ];
            const randReply = centralReplies[Math.floor(Math.random() * centralReplies.length)];
            addChatMessage('central', randReply);
        }, 2000);
    });

    // Ocorrências Rápidas
    quickReportButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const reportType = btn.getAttribute('data-type');
            addChatMessage('driver', `Ocorrência rápida reportada: *${reportType}*.`);
            showToast(`Ocorrência de "${reportType}" enviada com sucesso!`, 'success');

            // Fechar drawer no mobile ao enviar ocorrência
            if (window.innerWidth <= 768) {
                closeAllDrawers();
            }

            // Resposta específica da central
            setTimeout(() => {
                let reply = '';
                if (reportType === 'Trânsito intenso') reply = 'Central ciente da lentidão na via. Estimativas de ETA atualizadas.';
                else if (reportType === 'Acidente na via') reply = 'Entendido. Cuidado ao passar pelo local do incidente.';
                else if (reportType === 'Veículo com problema') reply = 'Suporte mecânico acionado para o veículo UBB-1254. Aguarde instrução.';
                else if (reportType === 'Parada bloqueada') reply = 'Registrado bloqueio de ponto escolar. Desvio autorizado se necessário.';
                else reply = 'Desvio temporário registrado na rota. GPS rastreando caminho alternativo.';

                addChatMessage('central', reply);
            }, 1800);
        });
    });

    // Disparo automático de Alerta Central simulado (apenas para simular dinamismo de suporte)
    setTimeout(() => {
        if (state.simActive && state.gpsOnline) {
            addChatMessage('central', 'Aviso: Parada bloqueada na Rota Leste temporariamente. Desvio autorizado para Rota 01.');
            showToast('Novo aviso recebido da Central de Operações!', 'warning');
        }
    }, 15000);

    // ==========================================================================
    // INICIALIZAÇÃO DO MÓDULO DO MOTORISTA
    // ==========================================================================
    
    renderRoutesList();
    updateStopIndicators();
    initLeafletMap();
    renderChatHistory();

});
