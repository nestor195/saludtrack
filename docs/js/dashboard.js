/**
 * Dashboard - Main Dashboard Logic
 * =================================
 * Lógica principal para el panel de control.
 */

// import { ta } from "zod/v4/locales";

(function() {
    'use strict';

    // Estado de la aplicación
    const state = {
        tiposMedicion: [],
        mediciones: [],
        currentTab: 'registro',
        currentView: 'lista',
        chart: null
    };

    // Referencias a elementos del DOM
    let elements = {};

    /**
     * Inicializa el dashboard
     */
    async function init() {
        console.log('Inicializando Dashboard...');
        
        // Inicializar IndexedDB
        await IndexedDBManager.init();
        
        // Capturar referencias a elementos
        cacheElements();
        
        // Configurar event listeners
        setupEventListeners();
        
        // Inicializar autenticación
        Auth.init();
        
        // Verificar estado de autenticación
        await checkAuthState();
        
        // Inicializar módulo de sincronización
        Sync.init();
    }

    /**
     * Cachea referencias a elementos del DOM
     */
    function cacheElements() {
        elements = {
            // Header
            userMenuBtn: document.getElementById('user-menu-btn'),
            userDropdown: document.getElementById('user-dropdown'),
            userAvatar: document.getElementById('user-avatar'),
            userName: document.getElementById('user-name'),
            dropdownAvatar: document.getElementById('dropdown-avatar'),
            dropdownName: document.getElementById('dropdown-name'),
            dropdownEmail: document.getElementById('dropdown-email'),
            logoutBtn: document.getElementById('logout-btn'),
            adminBtn: document.getElementById('admin-btn'),
            adminTabBtn: document.getElementById('admin-tab-btn'),
            
            // Navigation
            navTabs: document.querySelectorAll('.nav-tab'),
            
            // Tabs
            registroTab: document.getElementById('registro-tab'),
            historialTab: document.getElementById('historial-tab'),
            adminTabContent: document.getElementById('admin-tab'),
            
            // Form
            medicionForm: document.getElementById('medicion-form'),
            tipoMedicionSelect: document.getElementById('tipo-medicion'),
            fechaHoraInput: document.getElementById('fecha-hora'),
            valoresContainer: document.getElementById('valores-container'),
            observacionesInput: document.getElementById('observaciones'),
            
            // Filters
            filtroTipo: document.getElementById('filtro-tipo'),
            filtroFechaInicio: document.getElementById('filtro-fecha-inicio'),
            filtroFechaFin: document.getElementById('filtro-fecha-fin'),
            btnFiltrar: document.getElementById('btn-filtrar'),
            
            // Views
            viewBtns: document.querySelectorAll('.view-btn'),
            listaView: document.getElementById('lista-view'),
            graficoView: document.getElementById('grafico-view'),
            medicionesList: document.getElementById('mediciones-list'),
            emptyState: document.getElementById('empty-state'),
            chartEmpty: document.getElementById('chart-empty'),
            
            // Admin
            btnNuevoTipo: document.getElementById('btn-nuevo-tipo'),
            tiposList: document.getElementById('tipos-list'),
            
            // Modal Tipo
            modalTipo: document.getElementById('modal-tipo'),
            modalTipoTitle: document.getElementById('modal-tipo-title'),
            tipoForm: document.getElementById('tipo-form'),
            tipoNombre: document.getElementById('tipo-nombre'),
            tipoDescripcion: document.getElementById('tipo-descripcion'),
            tipoUnidad: document.getElementById('tipo-unidad'),
            tipoDosValores: document.getElementById('tipo-dos-valores'),
            tipoOrden: document.getElementById('tipo-orden'),
            tipoId: document.getElementById('tipo-id'),
            btnCancelarTipo: document.getElementById('btn-cancelar-tipo'),
            btnGuardarTipo: document.getElementById('btn-guardar-tipo'),
            
            // Modal Confirm
            modalConfirm: document.getElementById('modal-confirm'),
            confirmMessage: document.getElementById('confirm-message'),
            btnCancelarConfirm: document.getElementById('btn-cancelar-confirm'),
            btnConfirmarEliminar: document.getElementById('btn-confirmar-eliminar'),
            
            // Chart
            medicionesChart: document.getElementById('mediciones-chart')
        };
    }

    /**
     * Configura event listeners
     */
    function setupEventListeners() {
        // User menu
        elements.userMenuBtn?.addEventListener('click', toggleUserDropdown);
        document.addEventListener('click', handleOutsideClick);
        elements.logoutBtn?.addEventListener('click', handleLogout);
        elements.adminBtn.addEventListener('click', () => {
            switchTab('admin');
            handleOutsideClick({ target: elements.adminTabBtn });
        });
        
        // Navigation
        elements.navTabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });
        
        // Form
        elements.tipoMedicionSelect?.addEventListener('change', handleTipoMedicionChange);
        elements.medicionForm?.addEventListener('submit', handleMedicionSubmit);
        
        // Set default date/time
        if (elements.fechaHoraInput) {
            elements.fechaHoraInput.value = Utils.formatDateTimeLocal();
        }
        
        // Filters
        elements.btnFiltrar?.addEventListener('click', handleFilter);
        elements.filtroTipo?.addEventListener('change', handleFilter);
        
        // View toggle
        elements.viewBtns.forEach(btn => {
            btn.addEventListener('click', () => switchView(btn.dataset.view));
        });
        
        // Admin
        elements.btnNuevoTipo?.addEventListener('click', () => openTipoModal());
        elements.btnGuardarTipo?.addEventListener('click', handleGuardarTipo);
        elements.btnCancelarTipo?.addEventListener('click', () => closeModal('modal-tipo'));
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.classList.add('hidden');
            });
        });
        
        // Modal backdrop click
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.classList.add('hidden');
            });
        });
        
        // Confirm modal
        elements.btnCancelarConfirm?.addEventListener('click', () => closeModal('modal-confirm'));
        
        // Hash navigation
        handleHashNavigation();
        window.addEventListener('hashchange', handleHashNavigation);
    }

    /**
     * Verifica el estado de autenticación
     */
    async function checkAuthState() {
        return new Promise((resolve) => {
            const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
                unsubscribe();
                
                if (user) {
                    // Usuario autenticado
                    await loadUserData(user);
                    Utils.hideSplash();
                    resolve(true);
                } else {
                    // No autenticado - redirigir a login
                    window.location.href = 'index.html';
                    resolve(false);
                }
            });
        });
    }

    /**
     * Carga los datos del usuario
     */
    async function loadUserData(user) {
        console.log('user:',user);
        // Actualizar UI con datos del usuario
        updateUserUI(user);
        
        // Cargar tipos de medición
        await loadTiposMedicion();
        
        // Cargar mediciones recientes
        await loadMediciones();
        
        // Verificar si es admin (mostrar tab de admin)
        if (Auth.isAdmin()) {
            elements.adminTabBtn.style.display = 'flex';
            elements.adminBtn.classList.remove('hidden');
        }
        
        // Inicializar tipos predefinidos si es necesario
        await Firestore.initializeDefaultTipos();
        await loadTiposMedicion();
    }

    /**
     * Actualiza la UI con datos del usuario
     */
    function updateUserUI(user) {
        if (elements.userAvatar) {
            elements.userAvatar.src = user.photoURL || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2394a3b8"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/%3E%3C/svg%3E';
        }
        if (elements.userName) {
            elements.userName.textContent = user.displayName?.split(' ')[0] || 'Usuario';
        }
        if (elements.dropdownAvatar) {
            elements.dropdownAvatar.src = user.photoURL || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2394a3b8"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/%3E%3C/svg%3E';
        }
        if (elements.dropdownName) {
            elements.dropdownName.textContent = user.displayName || 'Usuario';
        }
        if (elements.dropdownEmail) {
            elements.dropdownEmail.textContent = user.email || '';
        }
    }

    /**
     * Toggle del menú de usuario
     */
    function toggleUserDropdown(e) {
        e.stopPropagation();
        elements.userDropdown.classList.toggle('hidden');
    }

    /**
     * Maneja clicks fuera del dropdown
     */
    function handleOutsideClick(e) {
        if (!elements.userMenuBtn?.contains(e.target) && !elements.userDropdown?.contains(e.target)) {
            elements.userDropdown?.classList.add('hidden');
        }
    }

    /**
     * Maneja el cierre de sesión
     */
    async function handleLogout() {
        await Auth.signOut();
    }

    /**
     * Cambia de pestaña
     */
    function switchTab(tabName) {
        state.currentTab = tabName;
        
        // Actualizar tabs
        elements.navTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Mostrar contenido
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const tabContent = document.getElementById(`${tabName}-tab`);
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        // Actualizar hash
        Utils.setUrlHash(tabName);
        
        // Cargar datos según la pestaña
        if (tabName === 'historial') {
            loadMediciones();
        } else if (tabName === 'admin') {
            loadTiposAdmin();
        }
    }

    /**
     * Maneja navegación por hash
     */
    function handleHashNavigation() {
        const hash = Utils.getUrlHash();
        if (hash && ['registro', 'historial', 'admin'].includes(hash)) {
            switchTab(hash);
        }
    }

    /**
     * Carga los tipos de medición
     */
    async function loadTiposMedicion() {
        const result = await Firestore.getTiposMedicion();
        
        if (result.success) {
            state.tiposMedicion = result.data;
            
            // Llenar select de tipos
            populateTipoSelect(elements.tipoMedicionSelect, 'Selecciona un tipo...');
            populateTipoSelect(elements.filtroTipo, 'Todos');
            
            // Actualizar valores del formulario
            handleTipoMedicionChange();
        }
    }

    /**
     * Llena un select con los tipos de medición
     */
    function populateTipoSelect(select, defaultOption) {
        if (!select) return;
        
        select.innerHTML = `<option value="">${defaultOption}</option>`;
        
        state.tiposMedicion.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id;
            option.textContent = `${tipo.nombre} (${tipo.unidad})`;
            select.appendChild(option);
        });
    }

    /**
     * Maneja el cambio de tipo de medición
     */
    function handleTipoMedicionChange() {
        const tipoId = elements.tipoMedicionSelect?.value;
        const tipo = state.tiposMedicion.find(t => t.id === tipoId);
        
        if (!elements.valoresContainer) return;
        
        if (!tipo) {
            elements.valoresContainer.innerHTML = '';
            return;
        }
        
        let html = '';
        
        if (tipo.requiere_dos_valores) {
            html = `
                <div class="form-group">
                    <label class="form-label">Valor Sistólico *</label>
                    <div class="valor-input-group">
                        <input type="number" id="valor-sistolica" class="form-input" 
                               placeholder="120" required min="60" max="250">
                        <span class="valor-unidad">${Utils.escapeHtml(tipo.unidad)}</span>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Valor Diastólico *</label>
                    <div class="valor-input-group">
                        <input type="number" id="valor-diastolica" class="form-input" 
                               placeholder="80" required min="40" max="150">
                        <span class="valor-unidad">${Utils.escapeHtml(tipo.unidad)}</span>
                    </div>
                </div>
            `;
        } else {
            html = `
                <div class="form-group">
                    <label class="form-label">Valor *</label>
                    <div class="valor-input-group">
                        <input type="number" id="valor" class="form-input" 
                               placeholder="Ingresa el valor" required step="0.1">
                        <span class="valor-unidad">${Utils.escapeHtml(tipo.unidad)}</span>
                    </div>
                </div>
            `;
        }
        
        elements.valoresContainer.innerHTML = html;
    }

    /**
     * Maneja el envío del formulario de medición
     */
    async function handleMedicionSubmit(e) {
        e.preventDefault();
        
        const tipoId = elements.tipoMedicionSelect.value;
        if (!tipoId) {
            Utils.showToast('Selecciona un tipo de medición', 'error');
            return;
        }
        
        const tipo = state.tiposMedicion.find(t => t.id === tipoId);
        
        // Obtener valores
        let valor, valor2;
        
        if (tipo.requiere_dos_valores) {
            const sistolica = document.getElementById('valor-sistolica');
            const diastolica = document.getElementById('valor-diastolica');
            
            const validacionSistolica = Utils.validateNumber(sistolica.value, 60, 250);
            const validacionDiastolica = Utils.validateNumber(diastolica.value, 40, 150);
            
            if (!validacionSistolica.valid) {
                Utils.showToast(validacionSistolica.error, 'error');
                return;
            }
            if (!validacionDiastolica.valid) {
                Utils.showToast(validacionDiastolica.error, 'error');
                return;
            }
            
            valor = validacionSistolica.value;
            valor2 = validacionDiastolica.value;
        } else {
            const valorInput = document.getElementById('valor');
            const validacion = Utils.validateNumber(valorInput.value);
            
            if (!validacion.valid) {
                Utils.showToast(validacion.error, 'error');
                return;
            }
            
            valor = validacion.value;
        }
        
        // Crear objeto de medición
        const medicion = {
            tipo_medicion_id: tipoId,
            medicion_nombre: tipo.nombre,
            medicion_id: tipoId,
            fechayhora: new Date(elements.fechaHoraInput.value).toISOString(),
            valor: valor,
            valor2: valor2 || null,
            medicion_observacion: elements.observacionesInput?.value || ''
        };
        
        // Guardar
        const result = await Firestore.saveMedicion(medicion);
        
        if (result.success) {
            // Resetear formulario
            elements.medicionForm.reset();
            elements.fechaHoraInput.value = Utils.formatDateTimeLocal();
            elements.valoresContainer.innerHTML = '';
            elements.tipoMedicionSelect.value = '';
            
            // Recargar mediciones
            await loadMediciones();
        }
    }

    /**
     * Carga las mediciones del usuario
     */
    async function loadMediciones(filters = {}) {
        const result = await Firestore.getMediciones(filters);
        
        if (result.success) {
            state.mediciones = result.data;
            renderMediciones();
        }
    }

    /**
     * Renderiza la lista de mediciones
     */
    function renderMediciones() {
        if (!elements.medicionesList) return;
        
        if (state.mediciones.length === 0) {
            elements.medicionesList.innerHTML = '';
            elements.emptyState?.classList.remove('hidden');
            elements.chartEmpty?.classList.remove('hidden');
            return;
        }
        
        elements.emptyState?.classList.add('hidden');
        elements.chartEmpty?.classList.add('hidden');
        
        elements.medicionesList.innerHTML = state.mediciones.map(med => {
            const tipo = state.tiposMedicion.find(t => t.id === med.medicion_id);
            const requiereDosValores = tipo?.requiere_dos_valores;
            
            return `
                <div class="medicion-card" data-id="${med.id}">
                    <div class="medicion-header">
                        <span class="medicion-tipo" style="background: ${Utils.getMedicionColor(med.medicion_nombre)}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                ${Utils.getMedicionIcon(med.medicion_nombre)}
                            </svg>
                            ${Utils.escapeHtml(med.medicion_nombre)}
                        </span>
                        <span class="medicion-fecha">${Utils.formatDate(med.fechayhora)}</span>
                    </div>
                    <div class="medicion-valores">
                        ${requiereDosValores ? `
                            <div class="medicion-valor">
                                <span class="valor">${med.valor}</span>
                                <span class="etiqueta">Sistólica (${tipo?.unidad || ''})</span>
                            </div>
                            <div class="medicion-valor">
                                <span class="valor">${med.valor2}</span>
                                <span class="etiqueta">Diastólica (${tipo?.unidad || ''})</span>
                            </div>
                        ` : `
                            <div class="medicion-valor">
                                <span class="valor">${Utils.formatNumber(med.valor, 1)}</span>
                                <span class="etiqueta">${tipo?.unidad || ''}</span>
                            </div>
                        `}
                    </div>
                    ${med.medicion_observacion ? `
                        <p class="medicion-observacion">${Utils.escapeHtml(med.medicion_observacion)}</p>
                    ` : ''}
                    <div class="medicion-actions">
                        <button class="btn-icon-sm delete" onclick="Dashboard.deleteMedicion('${med.id}')" title="Eliminar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Actualizar gráfico si está visible
        if (state.currentView === 'grafico') {
            updateChart();
        }
    }

    /**
     * Elimina una medición
     */
    async function deleteMedicion(id) {
        if (!confirm('¿Estás seguro de eliminar esta medición?')) return;
        
        const result = await Firestore.deleteMedicion(id);
        
        if (result.success) {
            await loadMediciones();
        }
    }

    /**
     * Maneja los filtros
     */
    async function handleFilter() {
        const filters = {};
        
        if (elements.filtroTipo?.value) {
            filters.tipoId = elements.filtroTipo.value;
        }
        if (elements.filtroFechaInicio?.value) {
            filters.fechaInicio = elements.filtroFechaInicio.value;
        }
        if (elements.filtroFechaFin?.value) {
            filters.fechaFin = elements.filtroFechaFin.value;
        }
        
        await loadMediciones(filters);
    }

    /**
     * Cambia la vista (lista/gráfico)
     */
    function switchView(view) {
        state.currentView = view;
        
        elements.viewBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        elements.listaView?.classList.toggle('hidden', view !== 'lista');
        elements.graficoView?.classList.toggle('hidden', view !== 'grafico');
        
        if (view === 'grafico') {
            updateChart();
        }
    }

    /**
     * Actualiza el gráfico
     */
    function updateChart() {
        const tipoId = elements.filtroTipo?.value;
        
        if (!tipoId) {
            elements.chartEmpty?.classList.remove('hidden');
            return;
        }
        
        const tipo = state.tiposMedicion.find(t => t.id === tipoId);
        const medicionesFiltradas = state.mediciones.filter(m => m.medicion_id === tipoId);
        
        if (medicionesFiltradas.length === 0) {
            elements.chartEmpty?.classList.remove('hidden');
            return;
        }
        
        elements.chartEmpty?.classList.add('hidden');
        
        const labels = medicionesFiltradas.map(m => Utils.formatDate(m.fechayhora, false));
        const datos = medicionesFiltradas.map(m => m.valor);
        const datos2 = medicionesFiltradas.map(m => m.valor2);
        
        // Destruir gráfico anterior
        if (state.chart) {
            state.chart.destroy();
        }
        
        const datasets = [{
            label: tipo.requiere_dos_valores ? 'Sistólica' : tipo.nombre,
            data: datos,
            borderColor: Utils.getMedicionColor(tipo.nombre),
            backgroundColor: Utils.getMedicionColor(tipo.nombre) + '20',
            tension: 0.3,
            fill: true
        }];
        
        if (tipo.requiere_dos_valores) {
            datasets.push({
                label: 'Diastólica',
                data: datos2,
                borderColor: '#10b981',
                backgroundColor: '#10b98120',
                tension: 0.3,
                fill: true
            });
        }
        
        state.chart = new Chart(elements.medicionesChart, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    // ================================
    // ADMIN FUNCTIONS
    // ================================

    /**
     * Carga los tipos de medición para administración
     */
    async function loadTiposAdmin() {
        if (!elements.tiposList) return;
        
        elements.tiposList.innerHTML = state.tiposMedicion.map(tipo => `
            <div class="tipo-card" data-id="${tipo.id}">
                <div class="tipo-info">
                    <h4>
                        ${Utils.escapeHtml(tipo.nombre)}
                        ${tipo.requiere_dos_valores ? '<span class="tipo-badge">2 valores</span>' : ''}
                    </h4>
                    <p>${Utils.escapeHtml(tipo.descripcion || 'Sin descripción')} - Unidad: ${Utils.escapeHtml(tipo.unidad)}</p>
                </div>
                <div class="tipo-actions">
                    <button class="btn-icon-sm" onclick="Dashboard.editTipo('${tipo.id}')" title="Editar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-icon-sm delete" onclick="Dashboard.confirmDeleteTipo('${tipo.id}', '${Utils.escapeHtml(tipo.nombre)}')" title="Eliminar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Abre el modal de tipo de medición
     */
    function openTipoModal(tipo = null) {
        elements.modalTipoTitle.textContent = tipo ? 'Editar Tipo de Medición' : 'Nuevo Tipo de Medición';
        
        // Limpiar formulario
        elements.tipoForm.reset();
        elements.tipoId.value = tipo?.id || '';
        
        if (tipo) {
            elements.tipoNombre.value = tipo.nombre || '';
            elements.tipoDescripcion.value = tipo.descripcion || '';
            elements.tipoUnidad.value = tipo.unidad || '';
            elements.tipoDosValores.checked = tipo.requiere_dos_valores || false;
            elements.tipoOrden.value = tipo.orden || 1;
        }
        
        elements.modalTipo.classList.remove('hidden');
    }

    /**
     * Cierra un modal
     */
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    }

    /**
     * Edita un tipo de medición
     */
    function editTipo(id) {
        const tipo = state.tiposMedicion.find(t => t.id === id);
        if (tipo) {
            openTipoModal(tipo);
        }
    }

    /**
     * Guarda un tipo de medición
     */
    async function handleGuardarTipo() {
        const data = {
            nombre: elements.tipoNombre.value.trim(),
            descripcion: elements.tipoDescripcion.value.trim(),
            unidad: elements.tipoUnidad.value.trim(),
            requiere_dos_valores: elements.tipoDosValores.checked,
            orden: parseInt(elements.tipoOrden.value) || 1
        };
        
        if (!data.nombre || !data.unidad) {
            Utils.showToast('Nombre y unidad son obligatorios', 'error');
            return;
        }
        
        let result;
        const id = elements.tipoId.value;
        
        if (id) {
            result = await Firestore.updateTipoMedicion(id, data);
        } else {
            result = await Firestore.createTipoMedicion(data);
        }
        
        if (result.success) {
            closeModal('modal-tipo');
            await loadTiposMedicion();
            await loadTiposAdmin();
        }
    }

    /**
     * Confirma eliminación de tipo
     */
    function confirmDeleteTipo(id, nombre) {
        elements.confirmMessage.textContent = `¿Estás seguro de eliminar el tipo "${nombre}"?`;
        elements.btnConfirmarEliminar.onclick = async () => {
            const result = await Firestore.deleteTipoMedicion(id);
            if (result.success) {
                closeModal('modal-confirm');
                await loadTiposMedicion();
                await loadTiposAdmin();
            }
        };
        elements.modalConfirm.classList.remove('hidden');
    }

    // Exponer funciones globalmente
    window.Dashboard = {
        deleteMedicion,
        editTipo,
        confirmDeleteTipo
    };

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
