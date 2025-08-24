// Mock data for static GitHub Pages deployment
const MOCK_DATA = {
    gsGrades: [
        { grade: '1', baseSalary: 22016, description: 'Entry level positions' },
        { grade: '2', baseSalary: 24782, description: 'Basic technical positions' },
        { grade: '3', baseSalary: 27025, description: 'Technical positions' },
        { grade: '4', baseSalary: 30344, description: 'Technical positions' },
        { grade: '5', baseSalary: 33972, description: 'Technical positions' },
        { grade: '6', baseSalary: 37738, description: 'Technical positions' },
        { grade: '7', baseSalary: 41947, description: 'Technical positions' },
        { grade: '8', baseSalary: 46425, description: 'Technical positions' },
        { grade: '9', baseSalary: 56769, description: 'Technical positions' },
        { grade: '10', baseSalary: 67074, description: 'Technical positions' },
        { grade: '11', baseSalary: 81044, description: 'Technical positions' },
        { grade: '12', baseSalary: 97139, description: 'Technical positions' },
        { grade: '13', baseSalary: 115518, description: 'Technical positions' },
        { grade: '14', baseSalary: 136466, description: 'Technical positions' },
        { grade: '15', baseSalary: 160432, description: 'Technical positions' }
    ],
    localityRates: {
        'WASHINGTON': { name: 'Washington-Baltimore-Arlington, DC-MD-VA-WV-PA', rate: 0.3219 },
        'NEW_YORK': { name: 'New York-Newark, NY-NJ-CT-PA', rate: 0.3513 },
        'LOS_ANGELES': { name: 'Los Angeles-Long Beach, CA', rate: 0.3438 },
        'CHICAGO': { name: 'Chicago-Naperville, IL-IN-WI', rate: 0.2976 },
        'HOUSTON': { name: 'Houston-The Woodlands-Sugar Land, TX', rate: 0.3219 },
        'PHOENIX': { name: 'Phoenix-Mesa-Scottsdale, AZ', rate: 0.2247 },
        'PHILADELPHIA': { name: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD', rate: 0.2976 },
        'SAN_ANTONIO': { name: 'San Antonio-New Braunfels, TX', rate: 0.2247 },
        'SAN_DIEGO': { name: 'San Diego-Chula Vista-Carlsbad, CA', rate: 0.3438 },
        'DALLAS': { name: 'Dallas-Fort Worth-Arlington, TX', rate: 0.3219 },
        'REST_OF_US': { name: 'Rest of U.S.', rate: 0.1653 }
    },
    steps: [
        { step: '1', multiplier: 1.0 },
        { step: '2', multiplier: 1.03 },
        { step: '3', multiplier: 1.06 },
        { step: '4', multiplier: 1.09 },
        { step: '5', multiplier: 1.12 },
        { step: '6', multiplier: 1.15 },
        { step: '7', multiplier: 1.18 },
        { step: '8', multiplier: 1.21 },
        { step: '9', multiplier: 1.24 },
        { step: '10', multiplier: 1.27 }
    ]
};

// Static calculator class
class StaticPersonnelCalculator {
    constructor() {
        this.initializeForm();
        this.bindEvents();
    }

    initializeForm() {
        this.populateGSGrades();
        this.populateSteps();
        this.populateLocalityAreas();
    }

    populateGSGrades() {
        const gradeSelect = document.getElementById('grade');
        if (gradeSelect) {
            gradeSelect.innerHTML = '<option value="">Select GS Grade</option>';
            MOCK_DATA.gsGrades.forEach(grade => {
                const option = document.createElement('option');
                option.value = grade.grade;
                option.textContent = `GS-${grade.grade} - $${grade.baseSalary.toLocaleString()}`;
                gradeSelect.appendChild(option);
            });
        }
    }

    populateSteps() {
        const stepSelect = document.getElementById('step');
        if (stepSelect) {
            stepSelect.innerHTML = '<option value="">Select Step</option>';
            MOCK_DATA.steps.forEach(step => {
                const option = document.createElement('option');
                option.value = step.step;
                option.textContent = `Step ${step.step}`;
                stepSelect.appendChild(option);
            });
        }
    }

    populateLocalityAreas() {
        const localitySelect = document.getElementById('locality');
        if (localitySelect) {
            localitySelect.innerHTML = '<option value="">Select Locality/State</option>';
            Object.entries(MOCK_DATA.localityRates).forEach(([code, data]) => {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = `${data.name} (${(data.rate * 100).toFixed(2)}%)`;
                localitySelect.appendChild(option);
            });
        }
    }

    bindEvents() {
        const form = document.getElementById('pricingForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.calculatePricing();
            });
        }
    }

    calculatePricing() {
        const formData = new FormData(document.getElementById('pricingForm'));
        const grade = formData.get('grade');
        const step = formData.get('step');
        const locality = formData.get('locality');
        const hoursPerYear = parseInt(formData.get('hoursPerYear')) || 2087;

        if (!grade || !step || !locality) {
            this.showError('Please fill in all required fields.');
            return;
        }

        const result = this.performCalculation(grade, step, locality, hoursPerYear);
        this.displayResults(result);
    }

    performCalculation(grade, step, locality, hoursPerYear) {
        const gradeData = MOCK_DATA.gsGrades.find(g => g.grade === grade);
        const stepData = MOCK_DATA.steps.find(s => s.step === step);
        const localityData = MOCK_DATA.localityRates[locality];

        if (!gradeData || !stepData || !localityData) {
            throw new Error('Invalid data selected');
        }

        const baseSalary = gradeData.baseSalary;
        const stepAdjustedSalary = baseSalary * stepData.multiplier;
        const localityAdjustedSalary = stepAdjustedSalary * (1 + localityData.rate);
        const hourlyRate = localityAdjustedSalary / hoursPerYear;
        const dailyRate = hourlyRate * 8;
        const weeklyRate = hourlyRate * 40;

        return {
            grade: grade,
            step: step,
            locality: locality,
            baseSalary: baseSalary,
            stepAdjustedSalary: stepAdjustedSalary,
            localityAdjustedSalary: localityAdjustedSalary,
            hourlyRate: hourlyRate,
            dailyRate: dailyRate,
            weeklyRate: weeklyRate,
            hoursPerYear: hoursPerYear,
            localityRate: localityData.rate,
            stepMultiplier: stepData.multiplier
        };
    }

    displayResults(result) {
        const resultsDiv = document.getElementById('results');
        if (!resultsDiv) return;

        resultsDiv.innerHTML = `
            <div class="results-container">
                <h3 class="text-center mb-4">
                    <i class="fas fa-calculator me-3"></i>
                    Pricing Results
                </h3>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="result-card">
                            <h5><i class="fas fa-user-tie me-2"></i>Position Details</h5>
                            <p><strong>GS Grade:</strong> GS-${result.grade}</p>
                            <p><strong>Step:</strong> ${result.step}</p>
                            <p><strong>Locality:</strong> ${MOCK_DATA.localityRates[result.locality].name}</p>
                            <p><strong>Annual Hours:</strong> ${result.hoursPerYear.toLocaleString()}</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="result-card">
                            <h5><i class="fas fa-dollar-sign me-2"></i>Salary Breakdown</h5>
                            <p><strong>Base Salary:</strong> $${result.baseSalary.toLocaleString()}</p>
                            <p><strong>Step Adjustment:</strong> +${((result.stepMultiplier - 1) * 100).toFixed(1)}%</p>
                            <p><strong>Locality Adjustment:</strong> +${(result.localityRate * 100).toFixed(2)}%</p>
                            <p><strong>Final Annual Salary:</strong> $${result.localityAdjustedSalary.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                
                <div class="row mt-3">
                    <div class="col-md-4">
                        <div class="rate-card">
                            <h5><i class="fas fa-clock me-2"></i>Hourly Rate</h5>
                            <div class="rate-value">$${result.hourlyRate.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="rate-card">
                            <h5><i class="fas fa-calendar-day me-2"></i>Daily Rate</h5>
                            <div class="rate-value">$${result.dailyRate.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="rate-card">
                            <h5><i class="fas fa-calendar-week me-2"></i>Weekly Rate</h5>
                            <div class="rate-value">$${result.weeklyRate.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                
                <div class="text-center mt-4">
                    <button class="btn btn-gov-primary me-2" onclick="window.calculator.exportToExcel()">
                        <i class="fas fa-file-excel me-2"></i>Export to Excel
                    </button>
                    <button class="btn btn-gov-secondary me-2" onclick="window.calculator.exportToPDF()">
                        <i class="fas fa-file-pdf me-2"></i>Export to PDF
                    </button>
                    <button class="btn btn-gov-success" onclick="window.calculator.printResults()">
                        <i class="fas fa-print me-2"></i>Print Results
                    </button>
                </div>
            </div>
        `;
    }

    showError(message) {
        const resultsDiv = document.getElementById('results');
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error:</strong> ${message}
                </div>
            `;
        }
    }

    exportToExcel() {
        // Implementation for Excel export
        alert('Excel export functionality available in full version');
    }

    exportToPDF() {
        // Implementation for PDF export
        alert('PDF export functionality available in full version');
    }

    printResults() {
        window.print();
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new StaticPersonnelCalculator();
});
