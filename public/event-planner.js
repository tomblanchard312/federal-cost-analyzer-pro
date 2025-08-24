// Government Event Cost Calculator - Event Planner Application
class GovernmentEventPlanner {
    constructor() {
        console.log('Event Planner: Initializing...');
        this.initializeData();
        this.setupEventListeners();
        this.loadInitialData();
        console.log('Event Planner: Initialization complete');
    }

    initializeData() {
        this.eventData = {
            eventName: '',
            eventType: '',
            locality: '',
            duration: 8,
            personnel: [],
            equipment: [],
            supplies: [],
            contractors: [],
            overtime: [],
            customCosts: []
        };
        this.currentInvoice = null;
        this.eventTypes = [];
        this.travelCosts = null;
        this.chargebackReport = null;
        
        this.personnelCounter = 0;
        this.equipmentCounter = 0;
        this.suppliesCounter = 0;
        this.contractorCounter = 0;
        this.overtimeCounter = 0;
        this.customCostCounter = 0;
    }

    async loadInitialData() {
        try {
            // Load event types
            const eventTypesResponse = await fetch('/api/event-types');
            const eventTypesData = await eventTypesResponse.json();
            this.eventTypes = eventTypesData.data;
            this.populateSelect('eventType', eventTypesData.data, 'code', 'name');

            // Load locality areas
            const localityResponse = await fetch('/api/locality-areas');
            const localityData = await localityResponse.json();
            this.populateSelect('locality', localityData.data, 'code', 'name');

            // Load GS grades
            const gradesResponse = await fetch('/api/gs-grades');
            const gradesData = await gradesResponse.json();
            this.gsGrades = gradesData.data;

            // Load equipment catalog
            const equipmentResponse = await fetch('/api/equipment');
            const equipmentData = await equipmentResponse.json();
            this.equipmentCatalog = equipmentData.data;

            // Load supplies catalog
            const suppliesResponse = await fetch('/api/supplies');
            const suppliesData = await suppliesResponse.json();
            this.suppliesCatalog = suppliesData.data;

            // Load chargeback categories
            const chargebackResponse = await fetch('/api/chargeback-categories');
            const chargebackData = await chargebackResponse.json();
            this.chargebackCategories = chargebackData.data;

            // Load airfare routes for origin/destination dropdowns
            await this.loadAirfareRoutes();

        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load form data. Please refresh the page.');
        }
    }

    populateSelect(selectId, data, valueField, textField) {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = '<option value="">Select...</option>';
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueField];
            option.textContent = item[textField];
            select.appendChild(option);
        });
    }

    async loadAirfareRoutes() {
        try {
            const response = await fetch('/api/airfare-routes');
            const data = await response.json();
            
            if (data.success) {
                // Get unique cities from all routes
                const cities = new Set();
                data.data.forEach(route => {
                    cities.add(route.origin);
                    cities.add(route.destination);
                });
                
                // Convert to array and sort alphabetically
                const sortedCities = Array.from(cities).sort();
                
                // Populate origin dropdown
                const originSelect = document.getElementById('airfareOrigin');
                if (originSelect) {
                    originSelect.innerHTML = '<option value="">Select Origin City</option>';
                    sortedCities.forEach(city => {
                        const option = document.createElement('option');
                        option.value = city;
                        option.textContent = city;
                        originSelect.appendChild(option);
                    });
                }
                
                // Populate destination dropdown
                const destinationSelect = document.getElementById('airfareDestination');
                if (destinationSelect) {
                    destinationSelect.innerHTML = '<option value="">Select Destination City</option>';
                    sortedCities.forEach(city => {
                        const option = document.createElement('option');
                        option.value = city;
                        option.textContent = city;
                        destinationSelect.appendChild(option);
                    });
                }
                
                console.log('Airfare routes loaded:', sortedCities.length, 'cities available');
            }
        } catch (error) {
            console.error('Error loading airfare routes:', error);
        }
    }

    setupEventListeners() {
        // Event type change - load defaults
        document.getElementById('eventType').addEventListener('change', (e) => {
            this.loadEventTypeDefaults(e.target.value);
        });

        // Form validation
        document.getElementById('eventName').addEventListener('input', () => this.validateBasicForm());
        document.getElementById('locality').addEventListener('change', () => this.validateBasicForm());
        document.getElementById('duration').addEventListener('input', () => this.validateBasicForm());
    }

    loadEventTypeDefaults(eventType) {
        if (!eventType || !this.eventTypes) return;

        const eventTypeData = this.eventTypes.find(et => et.code === eventType);
        if (!eventTypeData) return;

        // Load default personnel
        if (eventTypeData.defaultPersonnel && eventTypeData.defaultPersonnel.length > 0) {
            this.eventData.personnel = eventTypeData.defaultPersonnel.map(grade => ({
                grade: grade.replace('GS_', ''),
                step: 1,
                count: 1,
                hours: this.eventData.duration
            }));
            this.refreshPersonnelDisplay();
        }

        // Load default equipment
        if (eventTypeData.defaultEquipment && eventTypeData.defaultEquipment.length > 0) {
            this.eventData.equipment = eventTypeData.defaultEquipment.map(code => ({
                code,
                count: 1,
                hours: this.eventData.duration
            }));
            this.refreshEquipmentDisplay();
        }

        // Load default supplies
        if (eventTypeData.defaultSupplies && eventTypeData.defaultSupplies.length > 0) {
            this.eventData.supplies = eventTypeData.defaultSupplies.map(code => ({
                code,
                quantity: 1
            }));
            this.refreshSuppliesDisplay();
        }
    }

    validateBasicForm() {
        const eventName = document.getElementById('eventName').value;
        const locality = document.getElementById('locality').value;
        const duration = document.getElementById('duration').value;

        console.log('Validating form:', { eventName, locality, duration });
        const isValid = eventName && locality && duration;
        console.log('Form validation result:', isValid);
        
        return isValid;
    }

    // Tab Navigation Functions
    nextTab(targetTab) {
        console.log('nextTab called with targetTab:', targetTab);
        
        if (targetTab === 'personnel' && !this.validateBasicForm()) {
            console.log('Form validation failed, showing error');
            this.showError('Please complete all required fields before proceeding.');
            return;
        }
        
        console.log('Form validation passed, proceeding to tab:', targetTab);

        // Use Bootstrap 5 tab switching
        const targetTabElement = document.getElementById(targetTab);
        if (targetTabElement) {
            // Hide all tab panes
            const allTabPanes = document.querySelectorAll('.tab-pane');
            allTabPanes.forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            
            // Remove active class from all tab buttons
            const allTabButtons = document.querySelectorAll('.nav-link');
            allTabButtons.forEach(button => {
                button.classList.remove('active');
            });
            
            // Show target tab pane
            targetTabElement.classList.add('show', 'active');
            
            // Activate target tab button
            const targetTabButton = document.querySelector(`[data-bs-target="#${targetTab}"]`);
            if (targetTabButton) {
                targetTabButton.classList.add('active');
            }
            
            console.log(`Switched to tab: ${targetTab}`);
        } else {
            console.error(`Tab element not found: ${targetTab}`);
        }
    }

    previousTab(targetTab) {
        // Use Bootstrap 5 tab switching
        const targetTabElement = document.getElementById(targetTab);
        if (targetTabElement) {
            // Hide all tab panes
            const allTabPanes = document.querySelectorAll('.tab-pane');
            allTabPanes.forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            
            // Remove active class from all tab buttons
            const allTabButtons = document.querySelectorAll('.nav-link');
            allTabButtons.forEach(button => {
                button.classList.remove('active');
            });
            
            // Show target tab pane
            targetTabElement.classList.add('show', 'active');
            
            // Activate target tab button
            const targetTabButton = document.querySelector(`[data-bs-target="#${targetTab}"]`);
            if (targetTabButton) {
                targetTabButton.classList.add('active');
            }
            
            console.log(`Switched to tab: ${targetTab}`);
        } else {
            console.error(`Tab element not found: ${targetTab}`);
        }
    }

    // Global functions for tab navigation (called from HTML onclick)
    static nextTab(targetTab) {
        console.log('Static nextTab called with:', targetTab);
        if (window.eventPlanner) {
            console.log('Event planner found, calling nextTab');
            window.eventPlanner.nextTab(targetTab);
        } else {
            console.error('Event planner not found!');
        }
    }

    static previousTab(targetTab) {
        if (window.eventPlanner) {
            window.eventPlanner.previousTab(targetTab);
        }
    }

    static addPersonnelItem() {
        if (window.eventPlanner) {
            window.eventPlanner.addPersonnelItem();
        }
    }

    static addContractorItem() {
        if (window.eventPlanner) {
            window.eventPlanner.addContractorItem();
        }
    }

    static addOvertimeItem() {
        if (window.eventPlanner) {
            window.eventPlanner.addOvertimeItem();
        }
    }

    static addEquipmentItem() {
        if (window.eventPlanner) {
            window.eventPlanner.addEquipmentItem();
        }
    }

    static addSuppliesItem() {
        if (window.eventPlanner) {
            window.eventPlanner.addSuppliesItem();
        }
    }

    static addCustomCostItem() {
        if (window.eventPlanner) {
            window.eventPlanner.addCustomCostItem();
        }
    }

    static calculateEventCosts() {
        if (window.eventPlanner) {
            window.eventPlanner.calculateEventCosts();
        }
    }

    static generateChargebackReport() {
        if (window.eventPlanner) {
            window.eventPlanner.generateChargebackReport();
        }
    }

    // Personnel Management
    addPersonnelItem() {
        const personnelId = `personnel_${this.personnelCounter++}`;
        const personnelItem = {
            id: personnelId,
            grade: '',
            step: 1,
            count: 1,
            hours: this.eventData.duration
        };

        this.eventData.personnel.push(personnelItem);
        this.refreshPersonnelDisplay();
    }

    removePersonnelItem(id) {
        this.eventData.personnel = this.eventData.personnel.filter(p => p.id !== id);
        this.refreshPersonnelDisplay();
    }

    refreshPersonnelDisplay() {
        const container = document.getElementById('personnelContainer');
        if (!container) return;

        container.innerHTML = this.eventData.personnel.map(personnel => `
            <div class="personnel-item" data-id="${personnel.id}">
                <div class="row">
                    <div class="col-md-3">
                        <label class="form-label">GS Grade *</label>
                        <select class="form-select" onchange="updatePersonnel('${personnel.id}', 'grade', this.value)">
                            <option value="">Select Grade</option>
                            ${this.gsGrades.map(grade => 
                                `<option value="${grade.grade}" ${personnel.grade === grade.grade ? 'selected' : ''}>
                                    ${grade.description}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Step *</label>
                        <select class="form-select" onchange="updatePersonnel('${personnel.id}', 'step', this.value)">
                            ${Array.from({length: 10}, (_, i) => i + 1).map(step => 
                                `<option value="${step}" ${personnel.step === step ? 'selected' : ''}>Step ${step}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Count</label>
                        <input type="number" class="form-control" value="${personnel.count}" min="1" 
                               onchange="updatePersonnel('${personnel.id}', 'count', this.value)">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Hours</label>
                        <input type="number" class="form-control" value="${personnel.hours}" min="1" 
                               onchange="updatePersonnel('${personnel.id}', 'hours', this.value)">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Actions</label>
                        <button type="button" class="btn btn-gov-danger btn-sm w-100" 
                                onclick="removePersonnelItem('${personnel.id}')">
                            <i class="fas fa-trash me-1"></i>Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updatePersonnel(id, field, value) {
        const personnel = this.eventData.personnel.find(p => p.id === id);
        if (personnel) {
            personnel[field] = field === 'step' || field === 'count' || field === 'hours' ? parseInt(value) : value;
        }
    }

    // Contractor Management
    addContractorItem() {
        const contractorId = `contractor_${this.contractorCounter++}`;
        const contractorItem = {
            id: contractorId,
            service: '',
            count: 1,
            hours: this.eventData.duration,
            rate: 0
        };

        this.eventData.contractors.push(contractorItem);
        this.refreshContractorDisplay();
    }

    removeContractorItem(id) {
        this.eventData.contractors = this.eventData.contractors.filter(c => c.id !== id);
        this.refreshContractorDisplay();
    }

    refreshContractorDisplay() {
        const container = document.getElementById('contractorContainer');
        if (!container) return;

        container.innerHTML = this.eventData.contractors.map(contractor => `
            <div class="personnel-item" data-id="${contractor.id}">
                <div class="row">
                    <div class="col-md-3">
                        <label class="form-label">Service Type *</label>
                        <select class="form-select" onchange="updateContractor('${contractor.id}', 'service', this.value)">
                            <option value="">Select Service</option>
                            <option value="ENGINEERING" ${contractor.service === 'ENGINEERING' ? 'selected' : ''}>Engineering</option>
                            <option value="IT_SERVICES" ${contractor.service === 'IT_SERVICES' ? 'selected' : ''}>IT Services</option>
                            <option value="ADMINISTRATIVE" ${contractor.service === 'ADMINISTRATIVE' ? 'selected' : ''}>Administrative</option>
                            <option value="SECURITY" ${contractor.service === 'SECURITY' ? 'selected' : ''}>Security</option>
                            <option value="MEDICAL" ${contractor.service === 'MEDICAL' ? 'selected' : ''}>Medical</option>
                            <option value="LOGISTICS" ${contractor.service === 'LOGISTICS' ? 'selected' : ''}>Logistics</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Count</label>
                        <input type="number" class="form-control" value="${contractor.count}" min="1"
                               onchange="updateContractor('${contractor.id}', 'count', this.value)">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Hours</label>
                        <input type="number" class="form-control" value="${contractor.hours}" min="1"
                               onchange="updateContractor('${contractor.id}', 'hours', this.value)">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Hourly Rate</label>
                        <input type="number" class="form-control" value="${contractor.rate}" min="0" step="0.01"
                               onchange="updateContractor('${contractor.id}', 'rate', this.value)">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Actions</label>
                        <button type="button" class="btn btn-gov-danger btn-sm w-100"
                                onclick="removeContractorItem('${contractor.id}')">
                            <i class="fas fa-trash me-1"></i>Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateContractor(id, field, value) {
        const contractor = this.eventData.contractors.find(c => c.id === id);
        if (contractor) {
            contractor[field] = field === 'count' || field === 'hours' ? parseInt(value) : 
                               field === 'rate' ? parseFloat(value) : value;
        }
    }

    // Overtime Management
    addOvertimeItem() {
        const overtimeId = `overtime_${this.overtimeCounter++}`;
        const overtimeItem = {
            id: overtimeId,
            type: '',
            hours: 0,
            multiplier: 1.0
        };

        this.eventData.overtime.push(overtimeItem);
        this.refreshOvertimeDisplay();
    }

    removeOvertimeItem(id) {
        this.eventData.overtime = this.eventData.overtime.filter(o => o.id !== id);
        this.refreshOvertimeDisplay();
    }

    refreshOvertimeDisplay() {
        const container = document.getElementById('overtimeContainer');
        if (!container) return;

        container.innerHTML = this.eventData.overtime.map(overtime => `
            <div class="personnel-item" data-id="${overtime.id}">
                <div class="row">
                    <div class="col-md-4">
                        <label class="form-label">Overtime Type *</label>
                        <select class="form-select" onchange="updateOvertime('${overtime.id}', 'type', this.value)">
                            <option value="">Select Type</option>
                            <option value="REGULAR" ${overtime.type === 'REGULAR' ? 'selected' : ''}>Regular Overtime (1.5x)</option>
                            <option value="HOLIDAY" ${overtime.type === 'HOLIDAY' ? 'selected' : ''}>Holiday (2.0x)</option>
                            <option value="NIGHT_SHIFT" ${overtime.type === 'NIGHT_SHIFT' ? 'selected' : ''}>Night Shift (1.25x)</option>
                            <option value="WEEKEND" ${overtime.type === 'WEEKEND' ? 'selected' : ''}>Weekend (1.5x)</option>
                            <option value="EMERGENCY" ${overtime.type === 'EMERGENCY' ? 'selected' : ''}>Emergency (2.0x)</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Hours</label>
                        <input type="number" class="form-control" value="${overtime.hours}" min="0"
                               onchange="updateOvertime('${overtime.id}', 'hours', this.value)">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Multiplier</label>
                        <input type="number" class="form-control" value="${overtime.multiplier}" min="1" step="0.25"
                               onchange="updateOvertime('${overtime.id}', 'multiplier', this.value)">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Actions</label>
                        <button type="button" class="btn btn-gov-danger btn-sm w-100"
                                onclick="removeOvertimeItem('${overtime.id}')">
                            <i class="fas fa-trash me-1"></i>Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateOvertime(id, field, value) {
        const overtime = this.eventData.overtime.find(o => o.id === id);
        if (overtime) {
            overtime[field] = field === 'hours' ? parseInt(value) : 
                              field === 'multiplier' ? parseFloat(value) : value;
        }
    }

    // Custom Costs Management
    addCustomCostItem() {
        const customCostId = `custom_${this.customCostCounter++}`;
        const customCostItem = {
            id: customCostId,
            description: '',
            type: 'ONE_TIME',
            amount: 0,
            quantity: 1
        };

        this.eventData.customCosts.push(customCostItem);
        this.refreshCustomCostsDisplay();
    }

    removeCustomCostItem(id) {
        this.eventData.customCosts = this.eventData.customCosts.filter(c => c.id !== id);
        this.refreshCustomCostsDisplay();
    }

    refreshCustomCostsDisplay() {
        const container = document.getElementById('customCostsContainer');
        if (!container) return;

        container.innerHTML = this.eventData.customCosts.map(customCost => `
            <div class="personnel-item" data-id="${customCost.id}">
                <div class="row">
                    <div class="col-md-3">
                        <label class="form-label">Description *</label>
                        <input type="text" class="form-control" value="${customCost.description}" 
                               onchange="updateCustomCost('${customCost.id}', 'description', this.value)"
                               placeholder="Enter cost description">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Type</label>
                        <select class="form-select" onchange="updateCustomCost('${customCost.id}', 'type', this.value)">
                            <option value="ONE_TIME" ${customCost.type === 'ONE_TIME' ? 'selected' : ''}>One Time</option>
                            <option value="HOURLY" ${customCost.type === 'HOURLY' ? 'selected' : ''}>Hourly</option>
                            <option value="DAILY" ${customCost.type === 'DAILY' ? 'selected' : ''}>Daily</option>
                            <option value="PER_UNIT" ${customCost.type === 'PER_UNIT' ? 'selected' : ''}>Per Unit</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Amount</label>
                        <input type="number" class="form-control" value="${customCost.amount}" min="0" step="0.01"
                               onchange="updateCustomCost('${customCost.id}', 'amount', this.value)">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Quantity</label>
                        <input type="number" class="form-control" value="${customCost.quantity}" min="1"
                               onchange="updateCustomCost('${customCost.id}', 'quantity', this.value)">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Actions</label>
                        <button type="button" class="btn btn-gov-danger btn-sm w-100"
                                onclick="removeCustomCostItem('${customCost.id}')">
                            <i class="fas fa-trash me-1"></i>Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateCustomCost(id, field, value) {
        const customCost = this.eventData.customCosts.find(c => c.id === id);
        if (customCost) {
            customCost[field] = field === 'amount' ? parseFloat(value) : 
                                field === 'quantity' ? parseInt(value) : value;
        }
    }

    // Equipment Management
    addEquipmentItem() {
        const equipmentId = `equipment_${this.equipmentCounter++}`;
        const equipmentItem = {
            id: equipmentId,
            code: '',
            count: 1,
            hours: this.eventData.duration
        };

        this.eventData.equipment.push(equipmentItem);
        this.refreshEquipmentDisplay();
    }

    removeEquipmentItem(id) {
        this.eventData.equipment = this.eventData.equipment.filter(e => e.id !== id);
        this.refreshEquipmentDisplay();
    }

    refreshEquipmentDisplay() {
        const container = document.getElementById('equipmentContainer');
        if (!container) return;

        container.innerHTML = this.eventData.equipment.map(equipment => `
            <div class="equipment-item" data-id="${equipment.id}">
                <div class="row">
                    <div class="col-md-4">
                        <label class="form-label">Equipment *</label>
                        <select class="form-select" onchange="updateEquipment('${equipment.id}', 'code', this.value)">
                            <option value="">Select Equipment</option>
                            ${this.equipmentCatalog.map(item => 
                                `<option value="${item.code}" ${equipment.code === item.code ? 'selected' : ''}>
                                    ${item.name} (${item.category})
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Count</label>
                        <input type="number" class="form-control" value="${equipment.count}" min="1" 
                               onchange="updateEquipment('${equipment.id}', 'count', this.value)">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Hours</label>
                        <input type="number" class="form-control" value="${equipment.hours}" min="1" 
                               onchange="updateEquipment('${equipment.id}', 'hours', this.value)">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Actions</label>
                        <button type="button" class="btn btn-gov-danger btn-sm w-100" 
                                onclick="removeEquipmentItem('${equipment.id}')">
                            <i class="fas fa-trash me-1"></i>Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateEquipment(id, field, value) {
        const equipment = this.eventData.equipment.find(e => e.id === id);
        if (equipment) {
            equipment[field] = field === 'count' || field === 'hours' ? parseInt(value) : value;
        }
    }

    // Supplies Management
    addSuppliesItem() {
        const suppliesId = `supplies_${this.suppliesCounter++}`;
        const suppliesItem = {
            id: suppliesId,
            code: '',
            quantity: 1
        };

        this.eventData.supplies.push(suppliesItem);
        this.refreshSuppliesDisplay();
    }

    removeSuppliesItem(id) {
        this.eventData.supplies = this.eventData.supplies.filter(s => s.id !== id);
        this.refreshSuppliesDisplay();
    }

    refreshSuppliesDisplay() {
        const container = document.getElementById('suppliesContainer');
        if (!container) return;

        container.innerHTML = this.eventData.supplies.map(supplies => `
            <div class="supplies-item" data-id="${supplies.id}">
                <div class="row">
                    <div class="col-md-6">
                        <label class="form-label">Supplies *</label>
                        <select class="form-select" onchange="updateSupplies('${supplies.id}', 'code', this.value)">
                            <option value="">Select Supplies</option>
                            ${this.suppliesCatalog.map(item => 
                                `<option value="${item.code}" ${supplies.code === item.code ? 'selected' : ''}>
                                    ${item.name} (${item.category})
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Quantity</label>
                        <input type="number" class="form-control" value="${supplies.quantity}" min="1" 
                               onchange="updateSupplies('${supplies.id}', 'quantity', this.value)">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Actions</label>
                        <button type="button" class="btn btn-gov-danger btn-sm w-100" 
                                onclick="removeSuppliesItem('${supplies.id}')">
                            <i class="fas fa-trash me-1"></i>Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateSupplies(id, field, value) {
        const supplies = this.eventData.supplies.find(s => s.id === id);
        if (supplies) {
            supplies[field] = field === 'quantity' ? parseInt(value) : value;
        }
    }

    // Event Summary and Calculation
    updateEventSummary() {
        const eventName = document.getElementById('eventName').value;
        const eventType = document.getElementById('eventType').value;
        const locality = document.getElementById('locality').value;
        const duration = document.getElementById('duration').value;

        this.eventData.eventName = eventName;
        this.eventData.eventType = eventType;
        this.eventData.locality = locality;
        this.eventData.duration = parseInt(duration);

        const summaryContainer = document.getElementById('eventSummary');
        if (!summaryContainer) return;

        const eventTypeData = this.eventTypes?.find(et => et.code === eventType);
        
        summaryContainer.innerHTML = `
            <div class="cost-summary">
                <h5 class="text-center mb-3">
                    <i class="fas fa-info-circle me-2"></i>
                    Event Summary
                </h5>
                <div class="row">
                    <div class="col-md-6">
                        <div class="result-item">
                            <div class="result-label">Event Name</div>
                            <div class="result-value">${eventName || 'Not specified'}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-label">Event Type</div>
                            <div class="result-value">${eventTypeData?.name || 'Not specified'}</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="result-item">
                            <div class="result-label">Location</div>
                            <div class="result-value">${locality || 'Not specified'}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-label">Duration</div>
                            <div class="result-value">${duration || 0} hours</div>
                        </div>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-md-4 text-center">
                        <div class="result-label">Personnel Items</div>
                        <div class="result-value">${this.eventData.personnel.length}</div>
                    </div>
                    <div class="col-md-4 text-center">
                        <div class="result-label">Equipment Items</div>
                        <div class="result-value">${this.eventData.equipment.length}</div>
                    </div>
                    <div class="col-md-4 text-center">
                        <div class="result-label">Supplies Items</div>
                        <div class="result-value">${this.eventData.supplies.length}</div>
                    </div>
                </div>
            </div>
        `;
    }

    async calculateEventCosts() {
        // Update event data from form
        this.updateEventSummary();

        // Validate required fields
        if (!this.eventData.eventName || !this.eventData.locality || !this.eventData.duration) {
            this.showError('Please complete all required fields before calculating costs.');
            return;
        }

        if (this.eventData.personnel.length === 0) {
            this.showError('Please add at least one personnel requirement.');
            return;
        }

        if (this.eventData.equipment.length === 0) {
            this.showError('Please add at least one equipment requirement.');
            return;
        }

        try {
            // Include travel costs if available
            if (this.travelCosts && this.travelCosts.total > 0) {
                console.log('Including travel costs in event calculation:', this.travelCosts);
                // Add travel costs to the event data
                this.eventData.travelCosts = this.travelCosts;
            }

            const response = await fetch('/api/calculate-event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.eventData)
            });

            const result = await response.json();

            if (result.success) {
                this.displayCalculationResults(result.data);
            } else {
                this.showError(result.error || 'Calculation failed');
            }
        } catch (error) {
            console.error('Calculation error:', error);
            this.showError('Failed to calculate event costs. Please try again.');
        }
    }

    displayCalculationResults(data) {
        const resultsContainer = document.getElementById('calculationResults');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = `
            <div class="results-section">
                <h4 class="text-center mb-4">
                    <i class="fas fa-chart-bar me-2"></i>
                    Event Cost Calculation Results
                </h4>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="cost-summary">
                            <h6 class="text-center mb-3">Cost Breakdown</h6>
                            <div class="result-item">
                                <div class="result-label">Personnel Costs</div>
                                <div class="result-value">$${data.totalPersonnelCost.toFixed(2)}</div>
                            </div>
                            <div class="result-item">
                                <div class="result-label">Equipment Costs</div>
                                <div class="result-value">$${data.totalEquipmentCost.toFixed(2)}</div>
                            </div>
                            <div class="result-item">
                                <div class="result-label">Supplies Costs</div>
                                <div class="result-value">$${data.totalSuppliesCost.toFixed(2)}</div>
                            </div>
                            ${data.travelCosts ? `
                            <div class="result-item">
                                <div class="result-label">Travel Costs</div>
                                <div class="result-value">$${data.travelCosts.total.toFixed(2)}</div>
                            </div>
                            ` : ''}
                            <div class="result-item" style="border-left-color: var(--gov-primary);">
                                <div class="result-label">Total Event Cost</div>
                                <div class="result-value">$${data.totalEventCost.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="chargeback-breakdown">
                            <h6 class="text-center mb-3">Chargeback Categories</h6>
                            ${Object.entries(data.chargebackBreakdown).map(([key, category]) => `
                                <div class="result-item">
                                    <div class="result-label">${category.name}</div>
                                    <div class="result-value">$${category.billingAmount.toFixed(2)}</div>
                                    <small class="text-muted">${category.code} - ${category.costCenter}</small>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="section-divider"></div>
                
                <div class="row">
                    <div class="col-md-6">
                        <h6 class="text-center mb-3">Personnel Summary</h6>
                        <div class="result-item">
                            <div class="result-label">Total Personnel</div>
                            <div class="result-value">${data.summary.personnelCount}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-label">Average Hourly Rate</div>
                            <div class="result-value">$${data.summary.averageHourlyRate.toFixed(2)}</div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <h6 class="text-center mb-3">Equipment & Supplies Summary</h6>
                        <div class="result-item">
                            <div class="result-label">Equipment Items</div>
                            <div class="result-value">${data.summary.equipmentCount}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-label">Supplies Items</div>
                            <div class="result-value">${data.summary.suppliesCount}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async generateChargebackReport() {
        if (!this.eventData.eventName || !this.eventData.locality || !this.eventData.duration) {
            this.showError('Please complete the event setup before generating a chargeback report.');
            return;
        }

        try {
            const response = await fetch('/api/generate-chargeback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...this.eventData,
                    billingOrganization: 'Government Agency',
                    costCenter: 'EVENT_COSTS'
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log('Chargeback report generated successfully:', result.data);
                this.chargebackReport = result.data;
                console.log('Stored chargeback report:', this.chargebackReport);
                this.displayChargebackReport(result.data);
            } else {
                this.showError(result.error || 'Failed to generate chargeback report');
            }
        } catch (error) {
            console.error('Chargeback report error:', error);
            this.showError('Failed to generate chargeback report. Please try again.');
        }
    }

    displayChargebackReport(data) {
        const resultsContainer = document.getElementById('calculationResults');
        if (!resultsContainer) return;

        const reportHtml = `
            <div class="results-section">
                <h4 class="text-center mb-4">
                    <i class="fas fa-file-invoice me-2"></i>
                    Chargeback Report Generated
                </h4>
                
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong>Report ID:</strong> ${data.reportId}
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="cost-summary">
                            <h6 class="text-center mb-3">Billing Summary</h6>
                            <div class="result-item">
                                <div class="result-label">Total Billing Amount</div>
                                <div class="result-value">$${data.billingSummary.totalBillingAmount.toFixed(2)}</div>
                            </div>
                            <div class="result-item">
                                <div class="result-label">Billing Period</div>
                                <div class="result-value">${data.billingSummary.billingPeriod}</div>
                            </div>
                            <div class="result-item">
                                <div class="result-label">Payment Terms</div>
                                <div class="result-value">${data.billingSummary.paymentTerms}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="chargeback-breakdown">
                            <h6 class="text-center mb-3">Event Details</h6>
                            <div class="result-item">
                                <div class="result-label">Event Name</div>
                                <div class="result-value">${data.eventDetails.name}</div>
                            </div>
                            <div class="result-item">
                                <div class="result-label">Billing Organization</div>
                                <div class="result-value">${data.eventDetails.billingOrganization}</div>
                            </div>
                            <div class="result-item">
                                <div class="result-label">Cost Center</div>
                                <div class="result-value">${data.eventDetails.costCenter}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="text-center mt-4">
                    <button class="btn btn-gov-secondary" onclick="window.print()">
                        <i class="fas fa-print me-2"></i>Print Report
                    </button>
                                            <button class="btn btn-outline-primary ms-2" onclick="exportChargebackReport()">
                            <i class="fas fa-download me-2"></i>Export Report
                        </button>
                </div>
            </div>
        `;

        resultsContainer.innerHTML = reportHtml;
    }

    // Export chargeback report to CSV
    exportChargebackReport() {
        console.log('exportChargebackReport method called');
        if (this.chargebackReport && this.chargebackReport.chargebackCategories) {
            console.log('Chargeback report data found for export:', this.chargebackReport);
            // Create a CSV export
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Category,Code,Cost Center,Total Cost,Billing Amount\n";
            
            Object.entries(this.chargebackReport.chargebackCategories).forEach(([key, category]) => {
                csvContent += `"${category.name}","${category.code}","${category.costCenter}",${category.totalCost},${category.billingAmount}\n`;
            });
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "chargeback_report.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            console.log('No chargeback report or categories found');
            
            // Try to create a basic export with whatever data we have
            if (this.chargebackReport) {
                console.log('Attempting fallback export with available data');
                let csvContent = "data:text/csv;charset=utf-8,";
                csvContent += "Field,Value\n";
                
                // Export basic report info
                csvContent += `"Report ID","${this.chargebackReport.reportId || 'N/A'}"\n`;
                csvContent += `"Event Name","${this.chargebackReport.eventDetails?.name || 'N/A'}"\n`;
                csvContent += `"Total Cost","${this.chargebackReport.costSummary?.totalCost || 'N/A'}"\n`;
                csvContent += `"Total Personnel Cost","${this.chargebackReport.costSummary?.totalPersonnelCost || 'N/A'}"\n`;
                csvContent += `"Total Equipment Cost","${this.chargebackReport.costSummary?.totalEquipmentCost || 'N/A'}"\n`;
                csvContent += `"Total Supplies Cost","${this.chargebackReport.costSummary?.totalSuppliesCost || 'N/A'}"\n`;
                csvContent += `"Total Contractor Cost","${this.chargebackReport.costSummary?.totalContractorCost || 'N/A'}"\n`;
                csvContent += `"Total Overtime Cost","${this.chargebackReport.costSummary?.totalOvertimeCost || 'N/A'}"\n`;
                csvContent += `"Total Custom Cost","${this.chargebackReport.costSummary?.totalCustomCost || 'N/A'}"\n`;
                
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "chargeback_report_fallback.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                this.showError('No chargeback report available to export');
            }
        }
    }

    // Calculate travel costs using GSA data
    async calculateTravelCosts() {
        try {
            console.log('Calculating travel costs...');
            
            // Get form values
            const travelLocation = document.getElementById('travelLocation').value;
            const travelDays = parseInt(document.getElementById('travelDays').value) || 0;
            const includeLodging = document.getElementById('includeLodging').checked;
            const includeMeals = document.getElementById('includeMeals').checked;
            
            const airfareOrigin = document.getElementById('airfareOrigin').value;
            const airfareDestination = document.getElementById('airfareDestination').value;
            const tripType = document.getElementById('tripType').value;
            const travelers = parseInt(document.getElementById('travelers').value) || 1;
            
            const groundTransportation = parseFloat(document.getElementById('groundTransportation').value) || 0;
            const otherTravelCosts = parseFloat(document.getElementById('otherTravelCosts').value) || 0;
            
            // Validate required fields
            if (!travelLocation || travelDays <= 0) {
                this.showError('Please enter a valid travel location and number of days');
                return;
            }
            
            // Prepare request data
            const requestData = {
                perDiem: {
                    location: travelLocation,
                    days: travelDays,
                    includeLodging: includeLodging,
                    includeMeals: includeMeals
                }
            };
            
            // Add airfare if origin and destination are provided
            if (airfareOrigin && airfareDestination) {
                requestData.airfare = {
                    origin: airfareOrigin,
                    destination: airfareDestination,
                    tripType: tripType,
                    travelers: travelers
                };
            }
            
            // Add other costs
            if (groundTransportation > 0) {
                requestData.groundTransportation = groundTransportation;
            }
            
            if (otherTravelCosts > 0) {
                requestData.otherTravelCosts = otherTravelCosts;
            }
            
            console.log('Travel cost calculation request:', requestData);
            
            // Call API to calculate travel costs
            const response = await fetch('/api/calculate-travel-costs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('Travel costs calculated successfully:', result.data);
                this.displayTravelCostSummary(result.data);
                this.travelCosts = result.data; // Store for later use
            } else {
                this.showError(result.error || 'Failed to calculate travel costs');
            }
            
        } catch (error) {
            console.error('Error calculating travel costs:', error);
            this.showError('Error calculating travel costs: ' + error.message);
        }
    }

    // Calculate POV mileage costs
    async calculatePovMileage() {
        try {
            console.log('Calculating POV mileage...');
            
            const vehicleType = document.getElementById('vehicleType').value;
            const miles = parseFloat(document.getElementById('povMiles').value) || 0;
            const location = document.getElementById('povLocation').value;
            
            if (miles <= 0) {
                this.showError('Please enter a valid number of miles');
                return;
            }
            
            const requestData = {
                vehicleType: vehicleType,
                miles: miles,
                location: location
            };
            
            console.log('POV mileage calculation request:', requestData);
            
            const response = await fetch('/api/calculate-pov-mileage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('POV mileage calculated successfully:', result.data);
                this.showSuccess(`POV Mileage Cost: $${result.data.totalCost} (${result.data.miles} miles × $${result.data.ratePerMile}/mile)`);
                
                // Update the ground transportation field with POV cost
                document.getElementById('groundTransportation').value = result.data.totalCost;
            } else {
                this.showError(result.error || 'Failed to calculate POV mileage');
            }
            
        } catch (error) {
            console.error('Error calculating POV mileage:', error);
            this.showError('Error calculating POV mileage: ' + error.message);
        }
    }

    // Display travel cost summary
    displayTravelCostSummary(travelData) {
        const summaryDiv = document.getElementById('travelCostSummary');
        const breakdownDiv = document.getElementById('travelCostBreakdown');
        
        if (!summaryDiv || !breakdownDiv) {
            console.error('Travel cost summary elements not found');
            return;
        }
        
        let html = '<div class="row">';
        
        // Per Diem costs
        if (travelData.perDiem && travelData.perDiem.cost > 0) {
            html += `
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="fas fa-bed me-2"></i>Per Diem & Lodging</h6>
                        </div>
                        <div class="card-body">
                            <p><strong>Location:</strong> ${travelData.perDiem.details.location}</p>
                            <p><strong>Days:</strong> ${travelData.perDiem.details.days}</p>
                            <p><strong>Daily Rate:</strong> $${travelData.perDiem.details.dailyRate}</p>
                            <p><strong>Total Cost:</strong> $${travelData.perDiem.cost}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Airfare costs
        if (travelData.airfare && travelData.airfare.cost > 0) {
            html += `
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="fas fa-plane me-2"></i>Airfare</h6>
                        </div>
                        <div class="card-body">
                            <p><strong>Route:</strong> ${travelData.airfare.details.origin} → ${travelData.airfare.details.destination}</p>
                            <p><strong>Trip Type:</strong> ${travelData.airfare.details.tripType}</p>
                            <p><strong>Travelers:</strong> ${travelData.airfare.details.travelers}</p>
                            <p><strong>Total Cost:</strong> $${travelData.airfare.cost}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Ground transportation
        if (travelData.groundTransportation && travelData.groundTransportation.cost > 0) {
            html += `
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="fas fa-car me-2"></i>Ground Transportation</h6>
                        </div>
                        <div class="card-body">
                            <p><strong>Total Cost:</strong> $${travelData.groundTransportation.cost}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Other travel costs
        if (travelData.otherTravelCosts && travelData.otherTravelCosts.cost > 0) {
            html += `
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="fas fa-plus me-2"></i>Other Travel Costs</h6>
                        </div>
                        <div class="card-body">
                            <p><strong>Total Cost:</strong> $${travelData.otherTravelCosts.cost}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        
        // Total cost
        html += `
            <div class="alert alert-success mt-3">
                <h5><i class="fas fa-calculator me-2"></i>Total Travel Cost: $${travelData.total}</h5>
                <small class="text-muted">Based on GSA FY 2025 rates and policies</small>
            </div>
        `;
        
        breakdownDiv.innerHTML = html;
        summaryDiv.style.display = 'block';
    }

    // Generate invoice for the event
    async generateInvoice() {
        console.log('generateInvoice method called');
        try {
            // Validate form
            const form = document.getElementById('invoiceForm');
            console.log('Form element:', form);
            if (!form) {
                this.showError('Invoice form not found');
                return;
            }
            if (!form.checkValidity()) {
                console.log('Form validation failed');
                form.reportValidity();
                return;
            }

            // Get form data
            const formData = new FormData(form);
            const invoiceData = {
                ...this.eventData,
                billingOrganization: formData.get('billingOrganization'),
                billingAddress: formData.get('billingAddress'),
                billingContact: formData.get('billingContact'),
                costCenter: formData.get('costCenter'),
                invoiceTemplate: formData.get('invoiceTemplate'),
                billingTerms: formData.get('billingTerms'),
                invoiceNotes: formData.get('invoiceNotes')
            };

            // Call API to generate invoice
            const response = await fetch('/api/generate-invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(invoiceData)
            });

            const result = await response.json();
            if (result.success) {
                this.currentInvoice = result.data;
                this.displayInvoiceResults(result.data);
            } else {
                this.showError(result.error || 'Failed to generate invoice');
            }
        } catch (error) {
            console.error('Error generating invoice:', error);
            this.showError('Failed to generate invoice. Please try again.');
        }
    }

    // Display invoice generation results
    displayInvoiceResults(invoiceData) {
        const resultsContainer = document.getElementById('invoiceResults');
        const summaryContainer = document.getElementById('invoiceSummary');
        
        if (!resultsContainer || !summaryContainer) return;

        const summaryHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="cost-summary">
                        <h6 class="text-center mb-3">Invoice Details</h6>
                        <div class="result-item">
                            <div class="result-label">Invoice Number</div>
                            <div class="result-value">${invoiceData.invoiceNumber}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-label">Date</div>
                            <div class="result-value">${invoiceData.date}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-label">Due Date</div>
                            <div class="result-value">${invoiceData.dueDate}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-label">Total Amount</div>
                            <div class="result-value">$${invoiceData.totals.total.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="chargeback-breakdown">
                        <h6 class="text-center mb-3">Billing Information</h6>
                        <div class="result-item">
                            <div class="result-label">Organization</div>
                            <div class="result-value">${invoiceData.billingInfo.organization}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-label">Cost Center</div>
                            <div class="result-value">${invoiceData.billingInfo.costCenter}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-label">Terms</div>
                            <div class="result-value">${invoiceData.terms}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        summaryContainer.innerHTML = summaryHtml;
        resultsContainer.style.display = 'block';
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    // Export invoice to Excel
    async exportInvoiceExcel() {
        if (!this.currentInvoice) {
            this.showError('No invoice available to export');
            return;
        }

        try {
            const response = await fetch('/api/export-invoice-excel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ invoiceData: this.currentInvoice })
            });

            if (response.ok) {
                // Create blob and download
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `invoice-${this.currentInvoice.invoiceNumber}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const error = await response.json();
                this.showError(error.error || 'Failed to export to Excel');
            }
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            this.showError('Failed to export to Excel. Please try again.');
        }
    }

    // Export invoice to PDF
    async exportInvoicePDF() {
        if (!this.currentInvoice) {
            this.showError('No invoice available to export');
            return;
        }

        try {
            const response = await fetch('/api/export-invoice-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ invoiceData: this.currentInvoice })
            });

            if (response.ok) {
                // Create blob and download
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `invoice-${this.currentInvoice.invoiceNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const error = await response.json();
                this.showError(error.error || 'Failed to export to PDF');
            }
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            this.showError('Failed to export to PDF. Please try again.');
        }
    }

    showError(message) {
        // Create error alert
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger alert-gov';
        errorAlert.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Error:</strong> ${message}
        `;

        // Insert at top of main container
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.insertBefore(errorAlert, mainContainer.firstChild);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                errorAlert.remove();
            }, 5000);
        }
    }

    showSuccess(message) {
        // Create success alert
        const successAlert = document.createElement('div');
        successAlert.className = 'alert alert-success alert-gov';
        successAlert.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            <strong>Success:</strong> ${message}
        `;

        // Insert at top of main container
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.insertBefore(successAlert, mainContainer.firstChild);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                successAlert.remove();
            }, 5000);
        }
    }
}

// Initialize the event planner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating event planner...');
    window.eventPlanner = new GovernmentEventPlanner();
    
    // Make all methods globally accessible
    window.nextTab = window.eventPlanner.nextTab.bind(window.eventPlanner);
    window.previousTab = window.eventPlanner.previousTab.bind(window.eventPlanner);
    window.addPersonnelItem = window.eventPlanner.addPersonnelItem.bind(window.eventPlanner);
    window.removePersonnelItem = window.eventPlanner.removePersonnelItem.bind(window.eventPlanner);
    window.updatePersonnel = window.eventPlanner.updatePersonnel.bind(window.eventPlanner);
    window.addContractorItem = window.eventPlanner.addContractorItem.bind(window.eventPlanner);
    window.removeContractorItem = window.eventPlanner.removeContractorItem.bind(window.eventPlanner);
    window.updateContractor = window.eventPlanner.updateContractor.bind(window.eventPlanner);
    window.addOvertimeItem = window.eventPlanner.addOvertimeItem.bind(window.eventPlanner);
    window.removeOvertimeItem = window.eventPlanner.removeOvertimeItem.bind(window.eventPlanner);
    window.updateOvertime = window.eventPlanner.updateOvertime.bind(window.eventPlanner);
    window.addCustomCostItem = window.eventPlanner.addCustomCostItem.bind(window.eventPlanner);
    window.removeCustomCostItem = window.eventPlanner.removeCustomCostItem.bind(window.eventPlanner);
    window.updateCustomCost = window.eventPlanner.updateCustomCost.bind(window.eventPlanner);
    window.removeEquipmentItem = window.eventPlanner.removeEquipmentItem.bind(window.eventPlanner);
    window.removeSuppliesItem = window.eventPlanner.removeSuppliesItem.bind(window.eventPlanner);
    window.updateEquipment = window.eventPlanner.updateEquipment.bind(window.eventPlanner);
    window.updateSupplies = window.eventPlanner.updateSupplies.bind(window.eventPlanner);
    window.generateInvoice = window.eventPlanner.generateInvoice.bind(window.eventPlanner);
    window.exportInvoiceExcel = window.eventPlanner.exportInvoiceExcel.bind(window.eventPlanner);
    window.exportInvoicePDF = window.eventPlanner.exportInvoicePDF.bind(window.eventPlanner);
    window.generateChargebackReport = window.eventPlanner.generateChargebackReport.bind(window.eventPlanner);
    window.exportChargebackReport = window.eventPlanner.exportChargebackReport.bind(window.eventPlanner);
    window.calculateEventCosts = window.eventPlanner.calculateEventCosts.bind(window.eventPlanner);
    window.calculateTravelCosts = window.eventPlanner.calculateTravelCosts.bind(window.eventPlanner);
    window.calculatePovMileage = window.eventPlanner.calculatePovMileage.bind(window.eventPlanner);
    
    console.log('Event planner initialized and global functions created');
});
