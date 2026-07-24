// Personnel Cost Calculator — sources GS pay data from the backend API,
// which pulls real OPM General Schedule tables at runtime (no mock data here).

class PersonnelCalculator {
    constructor() {
        this.grades = [];
        this.localities = [];
        this.localityByCode = {};
        this.lastResult = null;
        this.init();
    }

    async init() {
        await this.loadReferenceData();
        this.populateSteps();
        this.bindEvents();
    }

    async loadReferenceData() {
        try {
            const [gradesRes, localityRes, seriesRes] = await Promise.all([
                fetch('/api/gs-grades'),
                fetch('/api/locality-areas'),
                fetch('/api/job-series')
            ]);
            const gradesData = await gradesRes.json();
            const localityData = await localityRes.json();
            const seriesData = await seriesRes.json();

            this.grades = gradesData.data || [];
            this.localities = localityData.data || [];
            this.localities.forEach((l) => { this.localityByCode[l.code] = l; });

            this.populateGrades();
            this.populateLocalities();
            this.populateJobSeries((seriesData && seriesData.data) || []);
        } catch (err) {
            console.error('Error loading reference data:', err);
            this.showError('Failed to load pay data from the server. Is the API running?');
        }
    }

    populateGrades() {
        const sel = document.getElementById('grade');
        if (!sel) return;
        sel.innerHTML = '<option value="">Select GS Grade</option>';
        this.grades.forEach((g) => {
            const opt = document.createElement('option');
            opt.value = g.grade;
            opt.textContent = `GS-${g.grade} — $${g.baseSalary.toLocaleString()} base`;
            sel.appendChild(opt);
        });
    }

    populateSteps() {
        const sel = document.getElementById('step');
        if (!sel) return;
        sel.innerHTML = '<option value="">Select Step</option>';
        for (let i = 1; i <= 10; i++) {
            const opt = document.createElement('option');
            opt.value = String(i);
            opt.textContent = `Step ${i}`;
            sel.appendChild(opt);
        }
    }

    populateLocalities() {
        const sel = document.getElementById('locality');
        if (!sel) return;
        sel.innerHTML = '<option value="">Select Locality/State</option>';
        this.localities.forEach((l) => {
            const opt = document.createElement('option');
            opt.value = l.code;
            opt.textContent = `${l.name} (${(l.rate * 100).toFixed(2)}%)`;
            sel.appendChild(opt);
        });
    }

    populateJobSeries(series) {
        const sel = document.getElementById('jobSeries');
        if (!sel) return;
        sel.innerHTML = '<option value="">Select Job Series</option>';
        series.forEach((s) => {
            const opt = document.createElement('option');
            opt.value = s.code;
            opt.textContent = `${s.code} - ${s.title}`;
            sel.appendChild(opt);
        });
    }

    bindEvents() {
        const form = document.getElementById('pricingForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.calculate();
            });
        }
    }

    async calculate() {
        const formData = new FormData(document.getElementById('pricingForm'));
        const grade = formData.get('grade');
        const step = formData.get('step');
        const locality = formData.get('locality');
        const hours = parseInt(formData.get('hoursPerYear'), 10) || 2087;

        if (!grade || !step || !locality) {
            this.showError('Please fill in all required fields.');
            return;
        }

        try {
            const res = await fetch('/api/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grade, step, locality, hours })
            });
            const result = await res.json();
            if (!result.success) {
                this.showError(result.error || 'Calculation failed.');
                return;
            }
            this.lastResult = result.data;
            this.displayResults(result.data);
        } catch (err) {
            console.error('Calculation error:', err);
            this.showError('Failed to calculate. Please try again.');
        }
    }

    displayResults(r) {
        const resultsDiv = document.getElementById('results');
        if (!resultsDiv) return;

        const localityName = (this.localityByCode[r.locality] || {}).name || r.locality;
        const src = r.dataSource || {};
        const sourceLabel = src.live
            ? 'Live OPM data'
            : (src.year ? `OPM ${src.year} tables` : 'OPM tables');

        resultsDiv.innerHTML = `
            <div class="results-container">
                <h3 class="text-center mb-4">
                    <i class="fas fa-calculator me-3"></i>Pricing Results
                </h3>
                <div class="row">
                    <div class="col-md-6">
                        <div class="result-card">
                            <h5><i class="fas fa-user-tie me-2"></i>Position Details</h5>
                            <p><strong>GS Grade:</strong> GS-${r.grade}</p>
                            <p><strong>Step:</strong> ${r.step}</p>
                            <p><strong>Locality:</strong> ${localityName}</p>
                            <p><strong>Annual Hours:</strong> ${r.annualHours.toLocaleString()}</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="result-card">
                            <h5><i class="fas fa-dollar-sign me-2"></i>Salary Breakdown</h5>
                            <p><strong>Base Salary (grade/step):</strong> $${r.baseSalary.toLocaleString()}</p>
                            <p><strong>Locality Adjustment:</strong> +${(r.localityRate * 100).toFixed(2)}%</p>
                            <p><strong>Adjusted Annual Salary:</strong> $${r.adjustedAnnualSalary.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-md-4">
                        <div class="rate-card">
                            <h5><i class="fas fa-clock me-2"></i>Hourly Rate</h5>
                            <div class="rate-value">$${r.hourlyRate.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="rate-card">
                            <h5><i class="fas fa-calendar-day me-2"></i>Daily Rate</h5>
                            <div class="rate-value">$${r.dailyRate.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="rate-card">
                            <h5><i class="fas fa-calendar-week me-2"></i>Weekly Rate</h5>
                            <div class="rate-value">$${r.weeklyRate.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                <p class="text-center text-muted mt-3"><small>
                    <i class="fas fa-database me-1"></i>Source: ${sourceLabel}
                </small></p>
                <div class="text-center mt-3">
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
        resultsDiv.style.display = 'block';
    }

    showError(message) {
        const resultsDiv = document.getElementById('results');
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error:</strong> ${message}
                </div>`;
            resultsDiv.style.display = 'block';
        }
    }

    exportToExcel() {
        if (!this.lastResult || typeof XLSX === 'undefined') {
            alert('Nothing to export yet. Calculate a result first.');
            return;
        }
        const r = this.lastResult;
        const rows = [
            ['Federal Cost Analyzer Pro — Personnel Cost'],
            [],
            ['GS Grade', `GS-${r.grade}`],
            ['Step', r.step],
            ['Locality', (this.localityByCode[r.locality] || {}).name || r.locality],
            ['Annual Hours', r.annualHours],
            ['Base Salary', r.baseSalary],
            ['Locality Rate', `${(r.localityRate * 100).toFixed(2)}%`],
            ['Adjusted Annual Salary', r.adjustedAnnualSalary],
            ['Hourly Rate', r.hourlyRate.toFixed(2)],
            ['Daily Rate', r.dailyRate.toFixed(2)],
            ['Weekly Rate', r.weeklyRate.toFixed(2)]
        ];
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Personnel Cost');
        XLSX.writeFile(wb, `gs-${r.grade}-step-${r.step}-cost.xlsx`);
    }

    exportToPDF() {
        if (!this.lastResult || !window.jspdf) {
            alert('Nothing to export yet. Calculate a result first.');
            return;
        }
        const r = this.lastResult;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Federal Cost Analyzer Pro — Personnel Cost', 14, 18);
        doc.setFontSize(11);
        const lines = [
            ['GS Grade', `GS-${r.grade}`],
            ['Step', String(r.step)],
            ['Locality', (this.localityByCode[r.locality] || {}).name || r.locality],
            ['Annual Hours', String(r.annualHours)],
            ['Base Salary', `$${r.baseSalary.toLocaleString()}`],
            ['Locality Rate', `${(r.localityRate * 100).toFixed(2)}%`],
            ['Adjusted Annual Salary', `$${r.adjustedAnnualSalary.toLocaleString()}`],
            ['Hourly Rate', `$${r.hourlyRate.toFixed(2)}`],
            ['Daily Rate', `$${r.dailyRate.toFixed(2)}`],
            ['Weekly Rate', `$${r.weeklyRate.toFixed(2)}`]
        ];
        if (doc.autoTable) {
            doc.autoTable({ startY: 26, head: [['Field', 'Value']], body: lines });
        } else {
            let y = 30;
            lines.forEach(([k, v]) => { doc.text(`${k}: ${v}`, 14, y); y += 8; });
        }
        doc.save(`gs-${r.grade}-step-${r.step}-cost.pdf`);
    }

    printResults() {
        window.print();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new PersonnelCalculator();
});
