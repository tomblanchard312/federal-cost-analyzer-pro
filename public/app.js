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
    ],
    jobSeries: [
        { code: '0301', title: 'Miscellaneous Administration and Program' },
        { code: '0340', title: 'Program Management' },
        { code: '0501', title: 'Financial Administration and Program' },
        { code: '0801', title: 'General Engineering' },
        { code: '0808', title: 'Architecture' },
        { code: '0854', title: 'Computer Engineering' },
        { code: '0855', title: 'Electronics Engineering' },
        { code: '1102', title: 'Contracting' },
        { code: '1550', title: 'Computer Science' },
        { code: '2210', title: 'Information Technology Management' },
        { code: '0303', title: 'Miscellaneous Clerk and Assistant' },
        { code: '0305', title: 'Miscellaneous Mail and File' },
        { code: '0312', title: 'Secretary' },
        { code: '0318', title: 'Secretary' },
        { code: '0326', title: 'Office Automation Clerk' },
        { code: '0332', title: 'Computer Operation' },
        { code: '0335', title: 'Computer Clerk and Assistant' },
        { code: '0341', title: 'Administrative Officer' },
        { code: '0342', title: 'Support Services Administration' },
        { code: '0343', title: 'Management and Program Analysis' },
        { code: '0344', title: 'Management and Program Clerical and Assistance' },
        { code: '0346', title: 'Logistics Management' },
        { code: '0350', title: 'Equipment Operator' },
        { code: '0351', title: 'Transportation Clerk and Assistant' },
        { code: '0356', title: 'Transportation Clerk and Assistant' },
        { code: '0357', title: 'Coding' },
        { code: '0358', title: 'Clerk-Typist' },
        { code: '0359', title: 'Data Transcriber' },
        { code: '0360', title: 'Equal Opportunity Compliance' },
        { code: '0361', title: 'Equal Opportunity Assistance' },
        { code: '0362', title: 'Contact Representative' },
        { code: '0363', title: 'Passport and Visa Examining' },
        { code: '0364', title: 'Citizen Information Specialist' },
        { code: '0365', title: 'Clerk' },
        { code: '0366', title: 'Clerk-Stenographer' },
        { code: '0367', title: 'Clerk-Typist' },
        { code: '0368', title: 'Clerk-Typist' },
        { code: '0369', title: 'Office Automation Clerk' },
        { code: '0370', title: 'Office Automation Clerk' },
        { code: '0371', title: 'Office Automation Clerk' },
        { code: '0372', title: 'Office Automation Clerk' },
        { code: '0373', title: 'Office Automation Clerk' },
        { code: '0374', title: 'Office Automation Clerk' },
        { code: '0375', title: 'Office Automation Clerk' },
        { code: '0376', title: 'Office Automation Clerk' },
        { code: '0377', title: 'Office Automation Clerk' },
        { code: '0378', title: 'Office Automation Clerk' },
        { code: '0379', title: 'Office Automation Clerk' },
        { code: '0380', title: 'Office Automation Clerk' },
        { code: '0381', title: 'Office Automation Clerk' },
        { code: '0382', title: 'Office Automation Clerk' },
        { code: '0383', title: 'Office Automation Clerk' },
        { code: '0384', title: 'Office Automation Clerk' },
        { code: '0385', title: 'Office Automation Clerk' },
        { code: '0386', title: 'Office Automation Clerk' },
        { code: '0387', title: 'Office Automation Clerk' },
        { code: '0388', title: 'Office Automation Clerk' },
        { code: '0389', title: 'Office Automation Clerk' },
        { code: '0390', title: 'Office Automation Clerk' },
        { code: '0391', title: 'Office Automation Clerk' },
        { code: '0392', title: 'Office Automation Clerk' },
        { code: '0393', title: 'Office Automation Clerk' },
        { code: '0394', title: 'Office Automation Clerk' },
        { code: '0395', title: 'Office Automation Clerk' },
        { code: '0396', title: 'Office Automation Clerk' },
        { code: '0397', title: 'Office Automation Clerk' },
        { code: '0398', title: 'Office Automation Clerk' },
        { code: '0399', title: 'Office Automation Clerk' }
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
        this.populateJobSeries();
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

    populateJobSeries() {
        const jobSeriesSelect = document.getElementById('jobSeries');
        if (jobSeriesSelect) {
            jobSeriesSelect.innerHTML = '<option value="">Select Job Series</option>';
            MOCK_DATA.jobSeries.forEach(series => {
                const option = document.createElement('option');
                option.value = series.code;
                option.textContent = `${series.code} - ${series.title}`;
                jobSeriesSelect.appendChild(option);
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
        
        // Show the results section
        resultsDiv.style.display = 'block';
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
            resultsDiv.style.display = 'block';
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
